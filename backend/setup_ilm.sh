#!/bin/bash

# Elasticsearch ILM Setup Script
# Run this after your Elasticsearch container is up and running

ELASTICSEARCH_URL="http://localhost:9200"

echo "Setting up Elasticsearch Index Lifecycle Management (ILM)..."

# 1. Create ILM Policy
echo "Creating ILM policy 'logstash-policy'..."
curl -X PUT "$ELASTICSEARCH_URL/_ilm/policy/logstash-policy" \
  -H "Content-Type: application/json" \
  -d '{
    "policy": {
      "phases": {
        "hot": {
          "actions": {
            "rollover": {
              "max_size": "1GB",
              "max_age": "1d",
              "max_docs": 100000
            }
          }
        },
        "warm": {
          "min_age": "2d",
          "actions": {
            "allocate": {
              "number_of_replicas": 0
            },
            "forcemerge": {
              "max_num_segments": 1
            }
          }
        },
        "cold": {
          "min_age": "7d",
          "actions": {
            "allocate": {
              "number_of_replicas": 0
            }
          }
        },
        "delete": {
          "min_age": "30d",
          "actions": {
            "delete": {}
          }
        }
      }
    }
  }'

echo -e "\n\n2. Creating index template with ILM policy..."
curl -X PUT "$ELASTICSEARCH_URL/_index_template/logstash-template" \
  -H "Content-Type: application/json" \
  -d '{
    "index_patterns": ["logstash-*"],
    "template": {
      "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 1,
        "index.lifecycle.name": "logstash-policy",
        "index.lifecycle.rollover_alias": "logstash-write"
      },
      "mappings": {
        "properties": {
          "@timestamp": {
            "type": "date"
          },
          "timestamp": {
            "type": "date"
          },
          "message": {
            "type": "text"
          },
          "level": {
            "type": "keyword"
          },
          "service": {
            "type": "keyword"
          },
          "host": {
            "type": "keyword"
          }
        }
      }
    }
  }'

echo -e "\n\n3. Creating bootstrap index and alias..."
# Create the first index
curl -X PUT "$ELASTICSEARCH_URL/logstash-000001" \
  -H "Content-Type: application/json" \
  -d '{
    "aliases": {
      "logstash-write": {
        "is_write_index": true
      }
    }
  }'

echo -e "\n\n4. Verifying ILM setup..."
echo "ILM Policy:"
curl -X GET "$ELASTICSEARCH_URL/_ilm/policy/logstash-policy?pretty"

echo -e "\n\nIndex Template:"
curl -X GET "$ELASTICSEARCH_URL/_index_template/logstash-template?pretty"

echo -e "\n\nAliases:"
curl -X GET "$ELASTICSEARCH_URL/_alias/logstash-write?pretty"

echo -e "\n\nILM Status:"
curl -X GET "$ELASTICSEARCH_URL/_ilm/status?pretty"

echo -e "\n\nSetup complete! Your Elasticsearch indices will now be managed automatically."
echo "Hot phase: Rollover after 1GB, 1 day, or 100k documents"
echo "Warm phase: After 2 days - reduce replicas, force merge"
echo "Cold phase: After 7 days - reduce replicas further"
echo "Delete phase: After 30 days - delete indices"