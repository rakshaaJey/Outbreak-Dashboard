	
import requests
import csv
from datetime import datetime
from pathlib import Path
 
# Toronto Open Data is stored in a CKAN instance. It's APIs are documented here:
# https://docs.ckan.org/en/latest/api/
 
# To hit our API, you'll be making requests to:
base_url = "https://ckan0.cf.opendata.inter.prod-toronto.ca"
 
# Datasets are called "packages". Each package can contain many "resources"
# To retrieve the metadata for this package and its resources, use the package name in this page's URL:
url = base_url + "/api/3/action/package_show"
params = { "id": "outbreaks-in-toronto-healthcare-institutions"}
package = requests.get(url, params = params).json()
 
# Create CSV file
timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
script_dir = Path(__file__).resolve().parent
public_dir = script_dir.parent / "my-app" / "public"
public_dir.mkdir(parents=True, exist_ok=True)
csv_filename = public_dir / "outbreaks.csv"

all_records = []

# To get resource data:
for idx, resource in enumerate(package["result"]["resources"]):
 
       # for datastore_active resources:
       if resource["datastore_active"]:
 
           # To selectively pull records and attribute-level metadata:
           url = base_url + "/api/3/action/datastore_search"
           p = { "id": resource["id"], "limit": 1000 }
           resource_search_data = requests.get(url, params = p).json()["result"]
           
           # Extract records
           if "records" in resource_search_data:
               records = resource_search_data["records"]
               all_records.extend(records)

if all_records:
    # Use the union of all field names across records to avoid missing columns.
    fieldnames = sorted({field for record in all_records for field in record.keys()})
    with open(csv_filename, 'w', newline='', encoding='utf-8') as csv_file:
        csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
        csv_writer.writeheader()
        csv_writer.writerows(all_records)

print(f"Data saved to {csv_filename}")
print(f"Total records: {len(all_records)}")