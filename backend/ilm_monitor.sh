#!/bin/bash

# Enhanced ILM Monitoring and Management Script with Security Features
# Based on your original script with added security monitoring

ELASTICSEARCH_URL="${ELASTICSEARCH_URL:-http://localhost:9200}"
ELASTIC_USER="${ELASTIC_USER:-elastic}"
ELASTIC_PASSWORD="${ELASTIC_PASSWORD}"

# Function to make authenticated requests
es_request() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="$3"
    
    if [ -n "$ELASTIC_PASSWORD" ]; then
        if [ -n "$data" ]; then
            curl -s -X "$method" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
                -H "Content-Type: application/json" \
                "$ELASTICSEARCH_URL/$endpoint" -d "$data"
        else
            curl -s -X "$method" -u "$ELASTIC_USER:$ELASTIC_PASSWORD" \
                "$ELASTICSEARCH_URL/$endpoint"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X "$method" -H "Content-Type: application/json" \
                "$ELASTICSEARCH_URL/$endpoint" -d "$data"
        else
            curl -s -X "$method" "$ELASTICSEARCH_URL/$endpoint"
        fi
    fi
}

show_help() {
    echo "Enhanced ILM Monitoring and Management Script"
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status      - Show ILM status and index information"
    echo "  security    - Show security-specific monitoring"
    echo "  policies    - List all ILM policies"
    echo "  indices     - Show all indices with their phases"
    echo "  explain     - Explain ILM status for specific indices"
    echo "  start       - Start ILM (if stopped)"
    echo "  stop        - Stop ILM"
    echo "  retry       - Retry failed ILM steps"
    echo "  cleanup     - Clean up old indices manually"
    echo "  test        - Test rollover manually"
    echo "  alerts      - Show recent security alerts"
    echo "  health      - Comprehensive health check"
    echo ""
}

show_status() {
    echo "=== Enhanced ILM Status ==="
    es_request "_ilm/status?pretty"
    
    echo -e "\n=== All Managed Indices ==="
    es_request "_cat/indices/logstash-*,security-alerts-*?v&h=index,status,health,pri,rep,docs.count,store.size,creation.date.string"
    
    echo -e "\n=== Write Aliases ==="
    es_request "_alias/*-write?pretty"
    
    echo -e "\n=== Index Sizes by Type ==="
    echo "Regular Logs:"
    es_request "_cat/indices/logstash-*?v&h=index,docs.count,store.size" | grep -v security-alerts || echo "No regular log indices found"
    
    echo -e "\nSecurity Alerts:"
    es_request "_cat/indices/security-alerts-*?v&h=index,docs.count,store.size" | head -10
    
    echo -e "\nError Logs:"
    es_request "_cat/indices/logstash-errors-*?v&h=index,docs.count,store.size" | head -5
}

show_security() {
    echo "=== Security Monitoring Dashboard ==="
    
    # Recent security alerts count
    SECURITY_ALERTS=$(es_request "security-alerts-*/_search?size=0&q=@timestamp:[now-1h TO now]" | \
        jq -r '.hits.total.value // 0' 2>/dev/null || echo "0")
    echo "Security alerts in last hour: $SECURITY_ALERTS"
    
    # Authentication failures
    AUTH_FAILURES=$(es_request "security-alerts-*/_search" POST '{
        "size": 0,
        "query": {
            "bool": {
                "must": [
                    {"term": {"security_alert": "auth_failure"}},
                    {"range": {"@timestamp": {"gte": "now-1h"}}}
                ]
            }
        }
    }' | jq -r '.hits.total.value // 0' 2>/dev/null || echo "0")
    echo "Authentication failures in last hour: $AUTH_FAILURES"
    
    # External sources
    EXTERNAL_SOURCES=$(es_request "logstash-*/_search" POST '{
        "size": 0,
        "query": {
            "bool": {
                "must": [
                    {"term": {"tags": "external_source"}},
                    {"range": {"@timestamp": {"gte": "now-1h"}}}
                ]
            }
        }
    }' | jq -r '.hits.total.value // 0' 2>/dev/null || echo "0")
    echo "External source events in last hour: $EXTERNAL_SOURCES"
    
    # Suspicious agents
    SUSPICIOUS_AGENTS=$(es_request "logstash-*/_search" POST '{
        "size": 0,
        "query": {
            "bool": {
                "must": [
                    {"term": {"tags": "suspicious_agent"}},
                    {"range": {"@timestamp": {"gte": "now-1h"}}}
                ]
            }
        }
    }' | jq -r '.hits.total.value // 0' 2>/dev/null || echo "0")
    echo "Suspicious agent events in last hour: $SUSPICIOUS_AGENTS"
    
    echo -e "\n=== Security Index Health ==="
    es_request "_cat/indices/security-alerts-*?v&h=index,health,status,docs.count,store.size"
    
    echo -e "\n=== Recent Security Alert Types ==="
    es_request "security-alerts-*/_search" POST '{
        "size": 0,
        "query": {
            "range": {"@timestamp": {"gte": "now-24h"}}
        },
        "aggs": {
            "alert_types": {
                "terms": {"field": "security_alert", "size": 10}
            }
        }
    }' | jq -r '.aggregations.alert_types.buckets[] | "\(.key): \(.doc_count)"' 2>/dev/null || echo "Unable to retrieve alert types"
}

show_policies() {
    echo "=== ILM Policies ==="
    es_request "_ilm/policy?pretty"
}

show_indices() {
    echo "=== Indices with ILM Information ==="
    es_request "logstash-*,security-alerts-*/_ilm/explain?pretty"
}

explain_ilm() {
    if [ -z "$2" ]; then
        echo "Usage: $0 explain <index_pattern>"
        echo "Example: $0 explain logstash-000001"
        echo "Example: $0 explain security-alerts-000001"
        exit 1
    fi
    
    echo "=== ILM Explanation for $2 ==="
    es_request "$2/_ilm/explain?pretty"
}

start_ilm() {
    echo "Starting ILM..."
    es_request "_ilm/start?pretty" POST
}

stop_ilm() {
    echo "Stopping ILM..."
    es_request "_ilm/stop?pretty" POST
}

retry_ilm() {
    if [ -z "$2" ]; then
        echo "Usage: $0 retry <index_name>"
        echo "Example: $0 retry logstash-000001"
        echo "Example: $0 retry security-alerts-000001"
        exit 1
    fi
    
    echo "Retrying ILM for $2..."
    es_request "$2/_ilm/retry?pretty" POST
}

cleanup_old_indices() {
    echo "=== Manual Cleanup Analysis ==="
    echo "Checking for indices that should be cleaned up..."
    
    # Check regular logstash indices
    echo -e "\n--- Regular Logstash Indices ---"
    es_request "_cat/indices/logstash-*?h=index,creation.date" | \
    while read index date; do
        if [ -n "$index" ] && [ "$index" != "index" ]; then
            creation_ts=$(date -d "$date" +%s 2>/dev/null || echo "0")
            current_ts=$(date +%s)
            days_old=$(( (current_ts - creation_ts) / 86400 ))
            
            if [ $days_old -gt 30 ]; then
                echo "Index $index is $days_old days old - candidate for deletion"
                # Uncomment to actually delete
                # es_request "$index" DELETE
            fi
        fi
    done
    
    # Check security alert indices (longer retention)
    echo -e "\n--- Security Alert Indices ---"
    es_request "_cat/indices/security-alerts-*?h=index,creation.date" | \
    while read index date; do
        if [ -n "$index" ] && [ "$index" != "index" ]; then
            creation_ts=$(date -d "$date" +%s 2>/dev/null || echo "0")
            current_ts=$(date +%s)
            days_old=$(( (current_ts - creation_ts) / 86400 ))
            
            if [ $days_old -gt 365 ]; then
                echo "Security index $index is $days_old days old - candidate for deletion"
                # Uncomment to actually delete
                # es_request "$index" DELETE
            fi
        fi
    done
    
    echo -e "\nTo actually delete indices, uncomment the deletion lines in the script"
    echo "WARNING: Security indices have 365-day retention policy!"
}

test_rollover() {
    echo "=== Testing Manual Rollover ==="
    
    echo "Testing regular logs rollover:"
    es_request "logstash-write/_rollover?pretty" POST '{
        "conditions": {
            "max_age": "0d"
        }
    }'
    
    echo -e "\nTesting security alerts rollover:"
    es_request "security-alerts-write/_rollover?pretty" POST '{
        "conditions": {
            "max_age": "0d"
        }
    }'
}

show_alerts() {
    echo "=== Recent Security Alerts ==="
    
    echo "Last 10 security alerts:"
    es_request "security-alerts-*/_search" POST '{
        "size": 10,
        "sort": [{"@timestamp": {"order": "desc"}}],
        "_source": ["@timestamp", "security_alert", "message", "host.ip", "source.ip"]
    }' | jq -r '.hits.hits[] | "\(._source["@timestamp"]) - \(._source.security_alert): \(._source.message[0:100])..."' 2>/dev/null || echo "Unable to retrieve recent alerts"
    
    echo -e "\nAlert summary for last 24 hours:"
    es_request "security-alerts-*/_search" POST '{
        "size": 0,
        "query": {
            "range": {"@timestamp": {"gte": "now-24h"}}
        },
        "aggs": {
            "alerts_by_hour": {
                "date_histogram": {
                    "field": "@timestamp",
                    "calendar_interval": "hour"
                }
            }
        }
    }' | jq -r '.aggregations.alerts_by_hour.buckets[] | "\(.key_as_string): \(.doc_count) alerts"' 2>/dev/null || echo "Unable to retrieve alert timeline"
}

health_check() {
    echo "=== Comprehensive Health Check ==="
    
    # Cluster health
    echo "Cluster Health:"
    CLUSTER_STATUS=$(es_request "_cluster/health" | jq -r '.status // "unknown"' 2>/dev/null)
    echo "Status: $CLUSTER_STATUS"
    
    # ILM health
    echo -e "\nILM Status:"
    ILM_STATUS=$(es_request "_ilm/status" | jq -r '.operation_mode // "unknown"' 2>/dev/null)
    echo "Operation Mode: $ILM_STATUS"
    
    # Index health summary
    echo -e "\nIndex Health Summary:"
    es_request "_cat/indices/logstash-*,security-alerts-*?h=index,health" | \
    awk '{print $2}' | sort | uniq -c | awk '{print $2 ": " $1 " indices"}'
    
    # Disk usage
    echo -e "\nDisk Usage:"
    es_request "_cat/allocation?v&h=node,disk.used_percent,disk.used,disk.total"
    
    # Failed ILM steps
    echo -e "\nFailed ILM Steps:"
    FAILED_COUNT=$(es_request "logstash-*,security-alerts-*/_ilm/explain" | \
        jq -r '[.indices[] | select(.step_info.type == "exception")] | length' 2>/dev/null || echo "0")
    echo "Indices with failed ILM steps: $FAILED_COUNT"
    
    if [ "$FAILED_COUNT" -gt 0 ]; then
        echo "Indices with ILM failures:"
        es_request "logstash-*,security-alerts-*/_ilm/explain" | \
            jq -r '.indices | to_entries[] | select(.value.step_info.type == "exception") | .key' 2>/dev/null
    fi
    
    # Overall health score
    echo -e "\n=== Health Score ==="
    if [ "$CLUSTER_STATUS" = "green" ] && [ "$ILM_STATUS" = "RUNNING" ] && [ "$FAILED_COUNT" -eq 0 ]; then
        echo "✅ HEALTHY - All systems operational"
        exit 0
    elif [ "$CLUSTER_STATUS" = "yellow" ] || [ "$FAILED_COUNT" -gt 0 ]; then
        echo "⚠️  WARNING - Some issues detected"
        exit 1
    else
        echo "❌ CRITICAL - Major issues detected"
        exit 2
    fi
}

# Main script logic
case "$1" in
    "status")
        show_status
        ;;
    "security")
        show_security
        ;;
    "policies")
        show_policies
        ;;
    "indices")
        show_indices
        ;;
    "explain")
        explain_ilm "$@"
        ;;
    "start")
        start_ilm
        ;;
    "stop")
        stop_ilm
        ;;
    "retry")
        retry_ilm "$@"
        ;;
    "cleanup")
        cleanup_old_indices
        ;;
    "test")
        test_rollover
        ;;
    "alerts")
        show_alerts
        ;;
    "health")
        health_check
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac