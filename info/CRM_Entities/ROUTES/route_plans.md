# route_plans.md

ROUTE { int route_id PK "1" int location_id FK "1" string day "Weekly" }

ROUTE { int route_id PK "2" int location_id FK "2" string day "Bi-weekly" }

ROUTE { int route_id PK "3" int location_id FK "3" string day "Monthly" }

ROUTE { int route_id PK "4" int location_id FK "2" string day "Every Tuesday" }

ROUTE { int route_id PK "5" int location_id FK "1" string day "Every Thursday" }
