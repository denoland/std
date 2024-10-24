# schedule_details.md

SCHEDULE { int schedule_id PK "1" int truck_id FK "1" int driver_id FK "1" int
route_id FK "1" date date "2024-09-21" }

SCHEDULE { int schedule_id PK "2" int truck_id FK "1" int driver_id FK "2" int
route_id FK "1" date date "2024-09-24" }

SCHEDULE { int schedule_id PK "3" int truck_id FK "2" int driver_id FK "1" int
route_id FK "2" date date "2024-09-26" }

SCHEDULE { int schedule_id PK "4" int truck_id FK "2" int driver_id FK "2" int
route_id FK "2" date date "2024-09-28" }

SCHEDULE { int schedule_id PK "5" int truck_id FK "3" int driver_id FK "3" int
route_id FK "3" date date "2024-10-05" }

SCHEDULE { int schedule_id PK "6" int truck_id FK "3" int driver_id FK "4" int
route_id FK "3" date date "2024-10-10" }

SCHEDULE { int schedule_id PK "7" int truck_id FK "4" int driver_id FK "1" int
route_id FK "4" date date "2024-10-12" }

SCHEDULE { int schedule_id PK "8" int truck_id FK "4" int driver_id FK "2" int
route_id FK "4" date date "2024-10-14" }

SCHEDULE { int schedule_id PK "9" int truck_id FK "5" int driver_id FK "3" int
route_id FK "5" date date "2024-10-17" }

SCHEDULE { int schedule_id PK "10" int truck_id FK "5" int driver_id FK "4" int
route_id FK "5" date date "2024-10-20" }
