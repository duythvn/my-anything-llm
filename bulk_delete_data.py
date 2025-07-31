import json


data = {
    "documentIds": list(range(1, 53)),
    "options": {}
}


with open('bulk_delete_data.json', 'w') as f:
    json.dump(data, f)