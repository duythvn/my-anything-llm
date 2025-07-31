import json


data = {
    "documentIds": list(range(1, 1002)),
    "updates": {"category": "test"}
}


with open('bulk_update_data.json', 'w') as f:
    json.dump(data, f)