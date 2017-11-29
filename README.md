# Domain Expert Bot - GitHub Crawler


## Installation

- Complete the cronjob.yaml file with the correct credentials and the Docker image name that you will use below
- Fill in the  collection_id variable for each repository in cronjob.yaml, using the Watson Discovery collection ID. 

- docker build -t <image_name> .
- docker push <image_name>
- kubectl create -f cronjob.yaml