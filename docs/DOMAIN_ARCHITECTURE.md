# Domain Architecture

This project is structured around the real operational workflow of an automotive repair shop.

## Main Business Flow

Customer -> Vehicle -> Vehicle Intake -> Work Order -> Parts Request -> Printable Documents -> Delivery

## Core Modules

### Customers
Stores customer information such as full name, phone number, WhatsApp, address and identification data.

### Vehicles
Stores vehicle information such as license plate, brand, model, year, color, mileage, chassis number and owner.

### Vehicle Intake
Registers how a vehicle enters the workshop, including visible condition, reported problem, fuel level, accessories, observations and photos.

### Work Orders
Manages the technical work performed on the vehicle, including diagnosis, assigned mechanic, requested work, completed work, labor cost and status.

### Parts Requests
Manages parts requested from the customer, including quantity, specification, authorization status and printable request documents.

### Print Documents
Contains printable templates such as vehicle intake receipt, work order, parts request and final delivery report.

### Reports
Provides operational reports for pending work, completed work, vehicles in workshop and business activity.

## Architectural Principles

- Domain-oriented structure.
- Clear separation between pages, components, models and data access.
- Reusable UI elements stored in shared components.
- Global services and configuration stored in core.
- Future Supabase integration isolated in core/supabase and feature data-access layers.
