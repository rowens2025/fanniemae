
    
    



select from_delinquency_bucket
from "neondb"."analytics_mart_mortgage"."fct_delinquency_rollforward"
where from_delinquency_bucket is null


