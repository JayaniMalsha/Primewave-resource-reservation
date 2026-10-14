# ResourceHub — Resource Reservation Management System



A full-stack resource reservation app built for the PrimeWave Lab Software Engineering Internship assessment.



## Features

* Register shared resources with type, location, capacity, description, and active/inactive status.
* Create reservations with requester details, purpose, and start/end date-times.
* Server-side validation for required fields, valid email, future start times, and end-after-start.
* Prevent overlapping confirmed reservations for the same resource. Adjacent bookings are allowed (10:00–11:00 and 11:00–12:00).
* Cancel reservations without deleting history; cancelled reservations no longer block availability.
* Search/filter reservations and view basic operational metrics.
* PostgreSQL persistence using Prisma ORM.
* Responsive dashboard for desktop and mobile.



## Tech stack

* Next.js 14 App Router, React, TypeScript
* PostgreSQL
* Prisma ORM
* Zod validation
* CSS (responsive, custom design)



## Requirements

* Node.js 20 or later
* PostgreSQL 14 or later
* npm



## Local setup

1. Install dependencies:

```bash
   npm install
   ```

2. Create a local PostgreSQL database, for example:

```sql
   CREATE DATABASE primewave\_reservations;
   ```

3. Copy `.env.example` to `.env` and update `DATABASE\_URL` with your PostgreSQL credentials.
4. Generate the Prisma client and create the database tables:

```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. Start the application:

```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).



## API endpoints

|Method|Endpoint|Purpose|
|-|-|-|
|GET|`/api/resources`|List resources|
|POST|`/api/resources`|Create resource|
|PATCH|`/api/resources/:id`|Activate/deactivate resource|
|GET|`/api/reservations`|List reservations|
|POST|`/api/reservations`|Create reservation with overlap validation|
|PATCH|`/api/reservations/:id`|Cancel a reservation|

Example resource payload:

```json
{
  "name": "Meeting Room A",
  "type": "Meeting Room",
  "location": "Level 2",
  "capacity": 8,
  "description": "Conference display and whiteboard"
}
```

Example reservation payload:

```json
{
  "resourceId": "RESOURCE\_ID",
  "requesterName": "Alex Perera",
  "requesterEmail": "alex@example.com",
  "purpose": "Project planning",
  "startAt": "2026-10-16T09:00:00.000Z",
  "endAt": "2026-10-16T10:00:00.000Z"
}
```



\## Data Model and ER Diagram



The system uses two main entities: `Resource` and `Reservation`. A resource can have multiple reservations, and each reservation references one resource.



\*\*Shareable ER Diagram:\*\*  

\[View the Resource Reservation ER Diagram](https://drive.google.com/file/d/1\_hgiV6acN2s7Vj7ASKqg9tqnp\_jcu6cl/view?usp=sharing)



\## Engineering Decisions



\- \*\*Conflict validation:\*\* Checks for overlapping confirmed reservations using `existing.startAt < requested.endAt AND existing.endAt > requested.startAt`. Adjacent reservations are allowed.

\- \*\*Resource management:\*\* Resources are deactivated rather than deleted to preserve historical records.

\- \*\*Reservation cancellation:\*\* Reservations are cancelled rather than deleted, preserving reservation history.

\- \*\*Database:\*\* PostgreSQL with Prisma ORM is required.



