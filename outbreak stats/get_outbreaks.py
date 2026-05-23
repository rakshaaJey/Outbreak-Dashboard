	
import requests
import csv
from datetime import datetime
 
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
csv_filename = f"outbreaks.csv"
csv_file = open(csv_filename, 'w', newline='', encoding='utf-8')
csv_writer = None

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
               
               # Initialize CSV writer with first set of records
               if csv_writer is None and records:
                   fieldnames = records[0].keys()
                   csv_writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
                   csv_writer.writeheader()
               
               # Write records to CSV
               for record in records:
                   csv_writer.writerow(record)

csv_file.close()
print(f"Data saved to {csv_filename}")
print(f"Total records: {len(all_records)}")