#!/bin/bash

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."
until curl -s -u elastic:${ELASTIC_PASSWORD:-changeme123} http://elasticsearch:9200/_cluster/health | grep -q '"status":"green"\|"status":"yellow"'; do
  echo "Waiting for Elasticsearch..."
  sleep 5
done

echo "Elasticsearch is ready!"

# Change password for logstash_system user (reserved user)
echo "Setting up logstash_system user password..."
curl -X POST -u elastic:${ELASTIC_PASSWORD:-changeme123} \
  -H "Content-Type: application/json" \
  -d '{
    "password": "'${LOGSTASH_PASSWORD:-logstash123}'"
  }' \
  http://elasticsearch:9200/_security/user/logstash_system/_password

# Change password for kibana_system user (reserved user)
echo "Setting up kibana_system user password..."
curl -X POST -u elastic:${ELASTIC_PASSWORD:-changeme123} \
  -H "Content-Type: application/json" \
  -d '{
    "password": "'${KIBANA_PASSWORD:-changeme123}'"
  }' \
  http://elasticsearch:9200/_security/user/kibana_system/_password

# Create composable index template for logstash (instead of legacy template)
echo "Creating logstash index template..."
curl -X PUT -u elastic:${ELASTIC_PASSWORD:-changeme123} \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["logstash-*"],
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "index.lifecycle.name": "logstash-policy",
        "index.lifecycle.rollover_alias": "logstash-write"
      },
      "mappings": {
        "properties": {
          "@timestamp": { "type": "date" },
          "message": { "type": "text" },
          "level": { "type": "keyword" },
          "service": { "type": "keyword" },
          "security_alert": { "type": "keyword" }
        }
      }
    },
    "priority": 100
  }' \
  http://elasticsearch:9200/_index_template/logstash-template

# Create composable index template for security alerts
echo "Creating security-alerts index template..."
curl -X PUT -u elastic:${ELASTIC_PASSWORD:-changeme123} \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["security-alerts-*"],
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "index.lifecycle.name": "logstash-policy",
        "index.lifecycle.rollover_alias": "security-alerts-write"
      },
      "mappings": {
        "properties": {
          "@timestamp": { "type": "date" },
          "message": { "type": "text" },
          "security_alert": { "type": "keyword" },
          "level": { "type": "keyword" },
          "service": { "type": "keyword" }
        }
      }
    },
    "priority": 100
  }' \
  http://elasticsearch:9200/_index_template/security-alerts-template

# Create initial indices only if they don't exist
echo "Creating initial indices..."
if ! curl -s -u elastic:${ELASTIC_PASSWORD:-changeme123} http://elasticsearch:9200/logstash-000001 | grep -q '"found":true'; then
  curl -X PUT -u elastic:${ELASTIC_PASSWORD:-changeme123} \
    -H "Content-Type: application/json" \
    -d '{
      "aliases": {
        "logstash-write": {
          "is_write_index": true
        }
      }
    }' \
    http://elasticsearch:9200/logstash-000001
fi

if ! curl -s -u elastic:${ELASTIC_PASSWORD:-changeme123} http://elasticsearch:9200/security-alerts-000001 | grep -q '"found":true'; then
  curl -X PUT -u elastic:${ELASTIC_PASSWORD:-changeme123} \
    -H "Content-Type: application/json" \
    -d '{
      "aliases": {
        "security-alerts-write": {
          "is_write_index": true
        }
      }
    }' \
    http://elasticsearch:9200/security-alerts-000001
fi

echo "Elasticsearch setup complete!" 