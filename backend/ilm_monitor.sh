#!/bin/bash

# ILM Monitoring and Management Script
# Use this to monitor and manage your ILM policies

ELASTICSEARCH_URL="http://localhost:9200"

show_help() {
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  status      - Show ILM status and index information"
    echo "  policies    - List all ILM policies"
    echo "  indices     - Show all indices with their phases"
    echo "  explain     - Explain ILM status for specific indices"
    echo "  start       - Start ILM (if stopped)"
    echo "  stop        - Stop ILM"
    echo "  retry       - Retry failed ILM steps"
    echo "  cleanup     - Clean up old indices manually"
    echo "  test        - Test rollover manually"
    echo ""
}

show_status() {
    echo "=== ILM Status ==="
    curl -s "$ELASTICSEARCH_URL/_ilm/status?pretty"
    
    echo -e "\n=== Index Overview ==="
    curl -s "$ELASTICSEARCH_URL/_cat/indices/logstash-*?v&h=index,status,health,pri,rep,docs.count,store.size,creation.date.string"
    
    echo -e "\n=== Write Alias ==="
    curl -s "$ELASTICSEARCH_URL/_alias/logstash-write?pretty"
}

show_policies() {
    echo "=== ILM Policies ==="
    curl -s "$ELASTICSEARCH_URL/_ilm/policy?pretty"
}

show_indices() {
    echo "=== Indices with ILM Information ==="
    curl -s "$ELASTICSEARCH_URL/logstash-*/_ilm/explain?pretty"
}

explain_ilm() {
    if [ -z "$2" ]; then
        echo "Usage: $0 explain <index_pattern>"
        echo "Example: $0 explain logstash-000001"
        exit 1
    fi
    
    echo "=== ILM Explanation for $2 ==="
    curl -s "$ELASTICSEARCH_URL/$2/_ilm/explain?pretty"
}

start_ilm() {
    echo "Starting ILM..."
    curl -X POST "$ELASTICSEARCH_URL/_ilm/start?pretty"
}

stop_ilm() {
    echo "Stopping ILM..."
    curl -X POST "$ELASTICSEARCH_URL/_ilm/stop?pretty"
}

retry_ilm() {
    if [ -z "$2" ]; then
        echo "Usage: $0 retry <index_name>"
        echo "Example: $0 retry logstash-000001"
        exit 1
    fi
    
    echo "Retrying ILM for $2..."
    curl -X POST "$ELASTICSEARCH_URL/$2/_ilm/retry?pretty"
}

cleanup_old_indices() {
    echo "=== Manual Cleanup ==="
    echo "This will show indices older than 30 days that should be deleted:"
    
    # Get indices older than 30 days
    curl -s "$ELASTICSEARCH_URL/_cat/indices/logstash-*?h=index,creation.date" | \
    while read index date; do
        # Convert creation date to timestamp
        creation_ts=$(date -d "$date" +%s 2>/dev/null || echo "0")
        current_ts=$(date +%s)
        days_old=$(( (current_ts - creation_ts) / 86400 ))
        
        if [ $days_old -gt 30 ]; then
            echo "Index $index is $days_old days old - candidate for deletion"
            # Uncomment the line below to actually delete
            # curl -X DELETE "$ELASTICSEARCH_URL/$index"
        fi
    done
    
    echo "To actually delete indices, uncomment the deletion line in the script"
}

test_rollover() {
    echo "=== Testing Manual Rollover ==="
    curl -X POST "$ELASTICSEARCH_URL/logstash-write/_rollover?pretty" \
      -H "Content-Type: application/json" \
      -d '{
        "conditions": {
          "max_age": "0d"
        }
      }'
}

# Main script logic
case "$1" in
    "status")
        show_status
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
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        echo "Unknown command: $1"
        show_help
        exit 1
        ;;
esac