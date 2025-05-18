# Database Documentation - Lost and Found System

This document provides a comprehensive overview of the database schema used in the Lost and Found System. The database is hosted on Supabase and follows a relational model with proper constraints and relationships.

## Database Overview

The Lost and Found System uses a PostgreSQL database on Supabase with the following tables:
- `admin` - Stores information about administrative users
- `satpam` - Stores information about security personnel 
- `user` - Stores information about regular users who can report lost or found items
- `barang_hilang` - Stores information about lost items
- `barang_temuan` - Stores information about found items
- `log_aktivitas` - Stores system activity logs

## Table Schemas

### admin

Stores information about system administrators.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id_admin | UUID | PRIMARY KEY | uuid_generate_v4() | Unique identifier for admin |
| nama | TEXT | NOT NULL | - | Admin's full name |
| username | TEXT | NOT NULL, UNIQUE | - | Admin's username for login |
| password | TEXT | NOT NULL | - | Admin's password (hashed) |
| created_at | TIMESTAMP WITH TIME ZONE | - | NOW() | When the admin account was created |

### satpam

Stores information about security personnel who verify reports.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id_satpam | UUID | PRIMARY KEY | uuid_generate_v4() | Unique identifier for security personnel |
| nama | TEXT | NOT NULL | - | Security personnel's full name |
| username | TEXT | NOT NULL, UNIQUE | - | Security's username for login |
| password | TEXT | NOT NULL | - | Security's password (hashed) |
| created_at | TIMESTAMP WITH TIME ZONE | - | NOW() | When the security account was created |

### user

Stores information about regular users who can report lost or found items.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id_user | UUID | PRIMARY KEY | uuid_generate_v4() | Unique identifier for user |
| nama | TEXT | NOT NULL | - | User's full name |
| nim_nip | TEXT | NOT NULL, UNIQUE | - | User's NIM (student ID) or NIP (employee ID) |
| username | TEXT | NOT NULL, UNIQUE | - | User's username for login |
| password | TEXT | NOT NULL | - | User's password (hashed) |
| created_at | TIMESTAMP WITH TIME ZONE | - | NOW() | When the user account was created |

### barang_hilang

Stores information about lost items reported by users.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id_hilang | UUID | PRIMARY KEY | uuid_generate_v4() | Unique identifier for lost item report |
| id_user | UUID | NOT NULL, FOREIGN KEY | - | Reference to user who reported the lost item |
| nama_barang | TEXT | NOT NULL | - | Name/title of the lost item |
| kategori | TEXT | NOT NULL | - | Category of the lost item |
| deskripsi | TEXT | - | - | Detailed description of the lost item |
| lokasi | TEXT | NOT NULL | - | Location where the item was lost |
| tanggal_hilang | DATE | NOT NULL | - | Date when the item was lost |
| status | TEXT | NOT NULL, CHECK | - | Status of the report: 'reported', 'verified', 'matched', 'returned' |
| image | TEXT | - | - | URL to the image of the lost item |
| created_at | TIMESTAMP WITH TIME ZONE | - | NOW() | When the report was created |

**Foreign Keys**:
- `id_user` references `user(id_user)` with CASCADE on DELETE

**Check Constraints**:
- `status` must be one of: 'reported', 'verified', 'matched', 'returned'

### barang_temuan

Stores information about found items reported by users.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id_temuan | UUID | PRIMARY KEY | uuid_generate_v4() | Unique identifier for found item report |
| id_user | UUID | NOT NULL, FOREIGN KEY | - | Reference to user who reported the found item |
| nama_barang | TEXT | NOT NULL | - | Name/title of the found item |
| kategori | TEXT | NOT NULL | - | Category of the found item |
| deskripsi | TEXT | - | - | Detailed description of the found item |
| lokasi | TEXT | NOT NULL | - | Location where the item was found |
| tanggal_temuan | DATE | NOT NULL | - | Date when the item was found |
| status | TEXT | NOT NULL, CHECK | - | Status of the report: 'reported', 'verified', 'matched', 'returned' |
| image | TEXT | - | - | URL to the image of the found item |
| created_at | TIMESTAMP WITH TIME ZONE | - | NOW() | When the report was created |

**Foreign Keys**:
- `id_user` references `user(id_user)` with CASCADE on DELETE

**Check Constraints**:
- `status` must be one of: 'reported', 'verified', 'matched', 'returned'

### log_aktivitas

Stores system activity logs for auditing and tracking purposes.

| Column | Type | Constraints | Default | Description |
|--------|------|-------------|---------|-------------|
| id_log | UUID | PRIMARY KEY | uuid_generate_v4() | Unique identifier for log entry |
| id_user | UUID | FOREIGN KEY | - | Reference to user who performed the action (can be NULL) |
| id_satpam | UUID | FOREIGN KEY | - | Reference to security personnel who performed the action (can be NULL) |
| id_admin | UUID | FOREIGN KEY | - | Reference to admin who performed the action (can be NULL) |
| aktivitas | TEXT | NOT NULL | - | Description of the activity/action performed |
| timestamp | TIMESTAMP WITH TIME ZONE | - | NOW() | When the activity occurred |

**Foreign Keys**:
- `id_user` references `user(id_user)` with SET NULL on DELETE
- `id_satpam` references `satpam(id_satpam)` with SET NULL on DELETE
- `id_admin` references `admin(id_admin)` with SET NULL on DELETE

**Indexes**:
- `idx_log_aktivitas_id_satpam` on (`id_satpam`) for faster security personnel action lookups
- `idx_log_aktivitas_id_admin` on (`id_admin`) for faster admin action lookups

## Relationships

1. **User to Lost Items (One-to-Many)**
   - A user can report multiple lost items
   - Each lost item is reported by one user

2. **User to Found Items (One-to-Many)**
   - A user can report multiple found items
   - Each found item is reported by one user

3. **User to Activity Logs (One-to-Many)**
   - A user can have multiple activity log entries
   - Each activity log is associated with at most one user (can be NULL)

4. **Security to Activity Logs (One-to-Many)**
   - A security personnel can have multiple activity log entries
   - Each activity log is associated with at most one security personnel (can be NULL)

5. **Admin to Activity Logs (One-to-Many)**
   - An admin can have multiple activity log entries
   - Each activity log is associated with at most one admin (can be NULL)

## Status Flow

The typical flow for reports in the system:

1. User reports an item as lost or found (status: `reported`)
2. Security personnel verifies the report (status: `verified`)
3. System automatically matches similar lost and found items (status: `matched`)
4. Item is returned to its owner (status: `returned`)

## Notes on Schema Limitations

The current schema does not include these fields which may be useful for future enhancements:

1. No `verified_by`, `verified_notes`, or `verified_at` fields in the report tables
2. No fields to track which reports have been matched together
3. No fields to record who returned/received returned items

These may be added in future schema updates as needed. 

## Recent Updates

1. **Addition of Security Personnel Tracking (2025-05-17)**
   - Added `id_satpam` column to `log_aktivitas` table to properly track security personnel actions
   - Created an index on `id_satpam` for faster lookups
   - Both user actions and security personnel actions are now properly attributed in activity logs

2. **Addition of Admin Tracking (2025-05-18)**
   - Added `id_admin` column to `log_aktivitas` table to properly track admin actions
   - Created an index on `id_admin` for faster lookups
   - Admin actions are now properly attributed in activity logs
   - All three user types (regular users, security personnel, admins) can now be tracked 