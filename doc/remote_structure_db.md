# Database Structure — Remote Host (61.19.112.242)

> **Container:** postgres_17_db | **Database:** datacenter | **User:** admin
> **Generated:** 2026-02-17

---

### 0. transform_sync_test

| #   | column   | data_type                | max_length | nullable | PK  |
| --- | -------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode  | character varying        | 20         | NO       | Y   |
| 4   | version  | text                     | -          | YES      | N   |
| 5   | d_update | timestamp with time zone | -          | YES      | N   |

### 1. transform_sync_bed_an_occupancy

| #   | column       | data_type                | max_length | nullable | PK  |
| --- | ------------ | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode      | character varying        | 20         | NO       | Y   |
| 2   | an_censored  | character varying        | 32         | NO       | Y   |
| 3   | bedno        | character varying        | 50         | NO       | Y   |
| 4   | export_code  | character varying        | 20         | NO       | Y   |
| 5   | regdate      | date                     | -          | NO       | Y   |
| 6   | dchdate      | date                     | -          | NO       | Y   |
| 7   | calc_start   | date                     | -          | NO       | N   |
| 8   | calc_end     | date                     | -          | NO       | N   |
| 9   | overlap_days | integer                  | -          | NO       | N   |
| 10  | d_update     | timestamp with time zone | -          | YES      | N   |

### 2. transform_sync_bed_type_all

| #   | column      | data_type                | max_length | nullable | PK  |
| --- | ----------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode     | character varying        | 20         | NO       | Y   |
| 2   | export_code | character varying        | 20         | NO       | Y   |
| 3   | bedno       | character varying        | 50         | NO       | Y   |
| 4   | bedtype     | character varying        | 50         | NO       | Y   |
| 5   | roomno      | character varying        | 50         | NO       | Y   |
| 6   | d_update    | timestamp with time zone | -          | YES      | N   |

### 3. transform_sync_critical_wait_bed

| #   | column             | data_type                | max_length | nullable | PK  |
| --- | ------------------ | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode            | character varying        | 20         | NO       | Y   |
| 2   | yr                 | integer                  | -          | NO       | Y   |
| 3   | yr_be              | integer                  | -          | NO       | N   |
| 4   | total_cases        | integer                  | -          | NO       | N   |
| 5   | admitted_cases     | integer                  | -          | NO       | N   |
| 6   | refer_out_cases    | integer                  | -          | NO       | N   |
| 7   | avg_wait_min       | numeric                  | -          | NO       | N   |
| 8   | avg_wait_hours     | numeric                  | -          | NO       | N   |
| 9   | avg_admit_wait_min | numeric                  | -          | NO       | N   |
| 10  | avg_admit_wait_hr  | numeric                  | -          | NO       | N   |
| 11  | avg_refer_wait_min | numeric                  | -          | NO       | N   |
| 12  | avg_refer_wait_hr  | numeric                  | -          | NO       | N   |
| 13  | pct_over_4hr       | numeric                  | -          | NO       | N   |
| 14  | d_update           | timestamp with time zone | -          | YES      | N   |

### 4. transform_sync_drgs_rw_top10

| #   | column     | data_type                | max_length | nullable | PK  |
| --- | ---------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode    | character varying        | 20         | NO       | Y   |
| 2   | y          | integer                  | -          | NO       | Y   |
| 3   | m          | integer                  | -          | NO       | Y   |
| 4   | drgs_code  | character varying        | 20         | NO       | Y   |
| 5   | sum_adj_rw | numeric                  | -          | NO       | N   |
| 6   | d_update   | timestamp with time zone | -          | YES      | N   |

### 5. transform_sync_drgs_sum

| #   | column    | data_type                | max_length | nullable | PK  |
| --- | --------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode   | character varying        | 20         | NO       | Y   |
| 2   | y         | integer                  | -          | NO       | Y   |
| 3   | m         | integer                  | -          | NO       | Y   |
| 4   | num_pt    | integer                  | -          | NO       | N   |
| 5   | sum_adjrw | numeric                  | -          | NO       | N   |
| 6   | cmi       | numeric                  | -          | NO       | N   |
| 7   | d_update  | timestamp with time zone | -          | YES      | N   |

### 6. transform_sync_icu_semi_icu_case_realtime

| #   | column   | data_type                | max_length | nullable | PK  |
| --- | -------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode  | character varying        | 20         | NO       | Y   |
| 2   | icu_case | integer                  | -          | NO       | N   |
| 3   | d_update | timestamp with time zone | -          | YES      | N   |

### 7. transform_sync_icu_ward_death

| #   | column      | data_type                | max_length | nullable | PK  |
| --- | ----------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode     | character varying        | 20         | NO       | Y   |
| 2   | y           | integer                  | -          | NO       | Y   |
| 3   | pdx         | character varying        | 20         | NO       | Y   |
| 4   | pdx_name    | character varying        | 255        | NO       | N   |
| 5   | death_count | integer                  | -          | NO       | N   |
| 6   | d_update    | timestamp with time zone | -          | YES      | N   |

### 8. transform_sync_mortality_ami

| #   | column             | data_type                | max_length | nullable | PK  |
| --- | ------------------ | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode            | character varying        | 20         | NO       | Y   |
| 2   | discharge_year     | integer                  | -          | NO       | Y   |
| 3   | total_admissions   | integer                  | -          | NO       | N   |
| 4   | deaths             | integer                  | -          | NO       | N   |
| 5   | mortality_rate_pct | numeric                  | -          | NO       | N   |
| 6   | d_update           | timestamp with time zone | -          | YES      | N   |

### 9. transform_sync_mortality_sepsis

| #   | column             | data_type                | max_length | nullable | PK  |
| --- | ------------------ | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode            | character varying        | 20         | NO       | Y   |
| 2   | discharge_year     | integer                  | -          | NO       | Y   |
| 3   | total_admissions   | integer                  | -          | NO       | N   |
| 4   | deaths             | integer                  | -          | NO       | N   |
| 5   | mortality_rate_pct | numeric                  | -          | NO       | N   |
| 6   | d_update           | timestamp with time zone | -          | YES      | N   |

### 10. transform_sync_normal_ward_death

| #   | column      | data_type                | max_length | nullable | PK  |
| --- | ----------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode     | character varying        | 20         | NO       | Y   |
| 2   | y           | integer                  | -          | NO       | Y   |
| 3   | pdx         | character varying        | 20         | NO       | Y   |
| 4   | pdx_name    | character varying        | 255        | YES      | N   |
| 5   | death_count | integer                  | -          | NO       | N   |
| 6   | d_update    | timestamp with time zone | -          | YES      | N   |

### 11. transform_sync_or_utilization_rate

| #   | column           | data_type                | max_length | nullable | PK  |
| --- | ---------------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode          | character varying        | 20         | NO       | Y   |
| 2   | op_year          | integer                  | -          | NO       | Y   |
| 3   | op_year_be       | integer                  | -          | NO       | N   |
| 4   | total_cases      | integer                  | -          | NO       | N   |
| 5   | total_or_minutes | numeric                  | -          | NO       | N   |
| 6   | avg_min_per_case | numeric                  | -          | NO       | N   |
| 7   | total_or_hours   | numeric                  | -          | NO       | N   |
| 8   | actual_or_days   | integer                  | -          | NO       | N   |
| 9   | avail_min_1room  | integer                  | -          | NO       | N   |
| 10  | util_pct         | numeric                  | -          | NO       | N   |
| 11  | d_update         | timestamp with time zone | -          | YES      | N   |

### 12. transform_sync_refer_paperless

| #   | column           | data_type                | max_length | nullable | PK  |
| --- | ---------------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode          | character varying        | 20         | NO       | Y   |
| 2   | y                | integer                  | -          | NO       | Y   |
| 3   | m                | integer                  | -          | NO       | Y   |
| 4   | refer_out_count  | integer                  | -          | NO       | N   |
| 5   | moph_refer_count | integer                  | -          | NO       | N   |
| 6   | d_update         | timestamp with time zone | -          | YES      | N   |

### 13. transform_sync_refer_top10

| #   | column      | data_type                | max_length | nullable | PK  |
| --- | ----------- | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode     | character varying        | 20         | NO       | Y   |
| 2   | icd10       | character varying        | 20         | NO       | Y   |
| 3   | icd10_name  | character varying        | 255        | NO       | N   |
| 4   | total_refer | integer                  | -          | NO       | N   |
| 5   | d_update    | timestamp with time zone | -          | YES      | N   |

### 14. transform_sync_waiting_time_cataract

| #   | column             | data_type                | max_length | nullable | PK  |
| --- | ------------------ | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode            | character varying        | 20         | NO       | Y   |
| 2   | visit_year         | integer                  | -          | NO       | Y   |
| 3   | total_appointments | integer                  | -          | NO       | N   |
| 4   | avg_wait_days      | numeric                  | -          | NO       | N   |
| 5   | min_wait_days      | integer                  | -          | NO       | N   |
| 6   | max_wait_days      | integer                  | -          | NO       | N   |
| 7   | avg_wait_weeks     | numeric                  | -          | NO       | N   |
| 8   | d_update           | timestamp with time zone | -          | YES      | N   |

### 15. transform_sync_waiting_time_hernia

| #   | column             | data_type                | max_length | nullable | PK  |
| --- | ------------------ | ------------------------ | ---------- | -------- | --- |
| 1   | hoscode            | character varying        | 20         | NO       | Y   |
| 2   | visit_year         | integer                  | -          | NO       | Y   |
| 3   | total_appointments | integer                  | -          | NO       | N   |
| 4   | avg_wait_days      | numeric                  | -          | NO       | N   |
| 5   | min_wait_days      | integer                  | -          | NO       | N   |
| 6   | max_wait_days      | integer                  | -          | NO       | N   |
| 7   | avg_wait_weeks     | numeric                  | -          | NO       | N   |
| 8   | d_update           | timestamp with time zone | -          | YES      | N   |
