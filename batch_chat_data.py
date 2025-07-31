import json


data = {
    "queries": [f"Query {i}" for i in range(1, 103)],
    "workspaceId": 1
}


with open('batch_chat_data.json', 'w') as f:
    json.dump(data, f)