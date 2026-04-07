# Extend the same Airflow version as your docker-compose.yaml (default 3.1.8).
ARG AIRFLOW_IMAGE=apache/airflow:3.1.8
FROM ${AIRFLOW_IMAGE}

USER root
COPY requirements-airflow.txt /requirements-airflow.txt
RUN pip install --no-cache-dir -r /requirements-airflow.txt

USER airflow
