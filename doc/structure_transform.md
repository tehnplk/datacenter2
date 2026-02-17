# Database Structure (transform tables)

### 0. transform_sync_test

| #   | column   | composite key (Y/N) | new composite key(Y/n) |
| --- | -------- | ------------------- | ---------------------- |
| 1   | hoscode  | Y                   | Y                      |
| 2   | version  | N                   | N                      |
| 3   | d_update | N                   | N                      |

### 1. transform_sync_bed_an_occupancy

| #   | column       | composite key (Y/N) | new composite key(Y/n) |
| --- | ------------ | ------------------- | ---------------------- |
| 1   | hoscode      | Y                   | Y                      |
| 2   | an_censored  | Y                   | Y                      |
| 3   | bedno        | Y                   | Y                      |
| 4   | export_code  | Y                   | Y                      |
| 5   | regdate      | Y                   | Y                      |
| 6   | dchdate      | Y                   | Y                      |
| 7   | calc_start   | Y                   | N                      |
| 8   | calc_end     | Y                   | N                      |
| 9   | overlap_days | Y                   | N                      |
| 10  | d_update     | N                   | N                      |

### 2. transform_sync_bed_type_all

| #   | column      | composite key (Y/N) | new composite key(Y/n) |
| --- | ----------- | ------------------- | ---------------------- |
| 1   | hoscode     | Y                   | Y                      |
| 2   | export_code | Y                   | Y                      |
| 3   | bedno       | Y                   | Y                      |
| 4   | bedtype     | Y                   | Y                      |
| 5   | roomno      | Y                   | Y                      |
| 6   | d_update    | N                   | N                      |

### 3. transform_sync_critical_wait_bed

| #   | column             | composite key (Y/N) | new composite key(Y/n) |
| --- | ------------------ | ------------------- | ---------------------- |
| 1   | hoscode            | Y                   | Y                      |
| 2   | yr                 | Y                   | Y                      |
| 3   | yr_be              | Y                   | N                      |
| 4   | total_cases        | Y                   | N                      |
| 5   | admitted_cases     | Y                   | N                      |
| 6   | refer_out_cases    | Y                   | N                      |
| 7   | avg_wait_min       | Y                   | N                      |
| 8   | avg_wait_hours     | Y                   | N                      |
| 9   | avg_admit_wait_min | Y                   | N                      |
| 10  | avg_admit_wait_hr  | Y                   | N                      |
| 11  | avg_refer_wait_min | Y                   | N                      |
| 12  | avg_refer_wait_hr  | Y                   | N                      |
| 13  | pct_over_4hr       | Y                   | N                      |
| 14  | d_update           | N                   | N                      |

### 4. transform_sync_drgs_rw_top10

| #   | column     | composite key (Y/N) | new composite key(Y/n) |
| --- | ---------- | ------------------- | ---------------------- |
| 1   | hoscode    | Y                   | Y                      |
| 2   | y          | Y                   | Y                      |
| 3   | m          | Y                   | Y                      |
| 4   | drgs_code  | Y                   | Y                      |
| 5   | sum_adj_rw | Y                   | N                      |
| 6   | d_update   | N                   | N                      |

### 5. transform_sync_drgs_sum

| #   | column    | composite key (Y/N) | new composite key(Y/n) |
| --- | --------- | ------------------- | ---------------------- |
| 1   | hoscode   | Y                   | Y                      |
| 2   | y         | Y                   | Y                      |
| 3   | m         | Y                   | Y                      |
| 4   | num_pt    | Y                   | N                      |
| 5   | sum_adjrw | Y                   | N                      |
| 6   | cmi       | Y                   | N                      |
| 7   | d_update  | N                   | N                      |

### 6. transform_sync_icu_semi_icu_case_realtime

| #   | column   | composite key (Y/N) | new composite key(Y/n) |
| --- | -------- | ------------------- | ---------------------- |
| 1   | hoscode  | Y                   | Y                      |
| 2   | icu_case | Y                   | N                      |
| 3   | d_update | N                   | N                      |

### 7. transform_sync_icu_ward_death

| #   | column      | composite key (Y/N) | new composite key(Y/n) |
| --- | ----------- | ------------------- | ---------------------- |
| 1   | hoscode     | Y                   | Y                      |
| 2   | y           | Y                   | Y                      |
| 3   | pdx         | Y                   | Y                      |
| 4   | pdx_name    | Y                   | N                      |
| 5   | death_count | Y                   | N                      |
| 6   | d_update    | N                   | N                      |

### 8. transform_sync_mortality_ami

| #   | column             | composite key (Y/N) | new composite key(Y/n) |
| --- | ------------------ | ------------------- | ---------------------- |
| 1   | hoscode            | Y                   | Y                      |
| 2   | discharge_year     | Y                   | Y                      |
| 3   | total_admissions   | Y                   | N                      |
| 4   | deaths             | Y                   | N                      |
| 5   | mortality_rate_pct | Y                   | N                      |
| 6   | d_update           | N                   | N                      |

### 9. transform_sync_mortality_sepsis

| #   | column             | composite key (Y/N) | new composite key(Y/n) |
| --- | ------------------ | ------------------- | ---------------------- |
| 1   | hoscode            | Y                   | Y                      |
| 2   | discharge_year     | Y                   | Y                      |
| 3   | total_admissions   | Y                   | N                      |
| 4   | deaths             | Y                   | N                      |
| 5   | mortality_rate_pct | Y                   | N                      |
| 6   | d_update           | N                   | N                      |

### 10. transform_sync_normal_ward_death

| #   | column      | composite key (Y/N) | new composite key(Y/n) |
| --- | ----------- | ------------------- | ---------------------- |
| 1   | hoscode     | Y                   | Y                      |
| 2   | y           | Y                   | Y                      |
| 3   | pdx         | Y                   | Y                      |
| 4   | pdx_name    | N                   | N                      |
| 5   | death_count | Y                   | N                      |
| 6   | d_update    | N                   | N                      |

### 11. transform_sync_or_utilization_rate

| #   | column           | composite key (Y/N) | new composite key(Y/n) |
| --- | ---------------- | ------------------- | ---------------------- |
| 1   | hoscode          | Y                   | Y                      |
| 2   | op_year          | Y                   | Y                      |
| 3   | op_year_be       | Y                   | N                      |
| 4   | total_cases      | Y                   | N                      |
| 5   | total_or_minutes | Y                   | N                      |
| 6   | avg_min_per_case | Y                   | N                      |
| 7   | total_or_hours   | Y                   | N                      |
| 8   | actual_or_days   | Y                   | N                      |
| 9   | avail_min_1room  | Y                   | N                      |
| 10  | util_pct         | Y                   | N                      |
| 11  | d_update         | N                   | N                      |

### 12. transform_sync_refer_paperless

| #   | column           | composite key (Y/N) | new composite key(Y/n) |
| --- | ---------------- | ------------------- | ---------------------- |
| 1   | hoscode          | Y                   | Y                      |
| 2   | y                | Y                   | Y                      |
| 3   | m                | Y                   | Y                      |
| 4   | refer_out_count  | Y                   | N                      |
| 5   | moph_refer_count | Y                   | N                      |
| 6   | d_update         | N                   | N                      |

### 13. transform_sync_refer_top10

| #   | column      | composite key (Y/N) | new composite key(Y/n) |
| --- | ----------- | ------------------- | ---------------------- |
| 1   | hoscode     | Y                   | Y                      |
| 2   | icd10       | Y                   | Y                      |
| 3   | icd10_name  | Y                   | N                      |
| 4   | total_refer | Y                   | N                      |
| 5   | d_update    | N                   | N                      |

### 14. transform_sync_waiting_time_cataract

| #   | column             | composite key (Y/N) | new composite key(Y/n) |
| --- | ------------------ | ------------------- | ---------------------- |
| 1   | hoscode            | Y                   | Y                      |
| 2   | visit_year         | Y                   | Y                      |
| 3   | total_appointments | Y                   | N                      |
| 4   | avg_wait_days      | Y                   | N                      |
| 5   | min_wait_days      | Y                   | N                      |
| 6   | max_wait_days      | Y                   | N                      |
| 7   | avg_wait_weeks     | Y                   | N                      |
| 8   | d_update           | N                   | N                      |

### 15. transform_sync_waiting_time_hernia

| #   | column             | composite key (Y/N) | new composite key(Y/n) |
| --- | ------------------ | ------------------- | ---------------------- |
| 1   | hoscode            | Y                   | Y                      |
| 2   | visit_year         | Y                   | Y                      |
| 3   | total_appointments | Y                   | N                      |
| 4   | avg_wait_days      | Y                   | N                      |
| 5   | min_wait_days      | Y                   | N                      |
| 6   | max_wait_days      | Y                   | N                      |
| 7   | avg_wait_weeks     | Y                   | N                      |
| 8   | d_update           | N                   | N                      |
