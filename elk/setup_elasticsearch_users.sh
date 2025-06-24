#!/bin/bash

# Wait for Elasticsearch to be ready
echo "Waiting for Elasticsearch to be ready..."
until curl -s -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} http://elasticsearch:9200/_cluster/health | grep -q '"status":"green"\|"status":"yellow"'; do
  echo "Waiting for Elasticsearch..."
  sleep 5
done

echo "Elasticsearch is ready!"

# Create logstash_writer role first
echo "Creating logstash_writer role..."
curl -X PUT -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} \
  -H "Content-Type: application/json" \
  -d '{
    "cluster": ["monitor", "manage_index_templates", "manage_ilm"],
    "indices": [
      {
        "names": ["logstash-*", "security-alerts-*", ".monitoring-logstash-*"],
        "privileges": ["create_index", "create_doc", "index", "manage", "manage_ilm"]
      }
    ]
  }' \
  http://elasticsearch:9200/_security/role/logstash_writer

# Create custom logstash user
echo "Creating custom logstash user..."
curl -X PUT -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} \
  -H "Content-Type: application/json" \
  -d '{
    "password": "'${LOGSTASH_PASSWORD:-GGkGQ5ytkQzaB8BYioFJI4snU}'",
    "roles": ["logstash_writer", "logstash_system"],
    "full_name": "Logstash Writer User"
  }' \
  http://elasticsearch:9200/_security/user/logstash_writer_user

# Change password for kibana_system user (reserved user)
echo "Setting up kibana_system user password..."
curl -X POST -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} \
  -H "Content-Type: application/json" \
  -d '{
    "password": "'${KIBANA_PASSWORD:-yQJfaXjFFnwOprMmHIRQAOjOW}'"
  }' \
  http://elasticsearch:9200/_security/user/kibana_system/_password

# Create composable index template for logstash (instead of legacy template)
echo "Creating logstash index template..."
curl -X PUT -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} \
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
curl -X PUT -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} \
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

# Create ILM policy for logstash indices
echo "Creating ILM policy..."
curl -X PUT -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "actions": {
            "rollover": {
              "max_size": "50gb",
              "max_age": "7d"
            }
          }
        },
        "warm": {
          "min_age": "7d",
          "actions": {
            "allocate": {
              "number_of_replicas": 0
            }
          }
        },
        "delete": {
          "min_age": "30d"
        }
      }
    }
  }' \
  http://elasticsearch:9200/_ilm/policy/logstash-policy

# Create initial indices only if they don't exist
echo "Creating initial indices..."
if ! curl -s -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} http://elasticsearch:9200/logstash-000001 | grep -q '"found":true'; then
  curl -X PUT -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} \
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

if ! curl -s -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} http://elasticsearch:9200/security-alerts-000001 | grep -q '"found":true'; then
  curl -X PUT -u elastic:${ELASTIC_PASSWORD:-qfpOAarca6BFMvu0CfOpDqGds} \
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