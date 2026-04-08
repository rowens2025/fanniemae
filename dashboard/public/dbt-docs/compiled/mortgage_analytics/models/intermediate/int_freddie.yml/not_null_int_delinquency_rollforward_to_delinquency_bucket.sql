
    
    



select to_delinquency_bucket
from "neondb"."analytics_int_mortgage"."int_delinquency_rollforward"
where to_delinquency_bucket is null


