# Postman Collection Setup Guide

## How to Import the Collection

1. **Open Postman** (download from [postman.com](https://www.postman.com/downloads/) if you don't have it)

2. **Import the Collection:**
   - Click **"Import"** button (top left)
   - Select **"File"** tab
   - Choose `Dentist_Appointment_API.postman_collection.json`
   - Click **"Import"**

3. **The collection will appear in your Postman sidebar** with two folders:
   - **Reservations** - All reservation-related endpoints
   - **Patients** - All patient management endpoints

## Setting Up the Base URL

The collection uses a variable `{{base_url}}` which is set to `http://localhost:3000/api` by default.

### To change the base URL:

1. **Option 1: Edit Collection Variable**
   - Right-click on the collection name
   - Select **"Edit"**
   - Go to **"Variables"** tab
   - Update the `base_url` value (e.g., `https://your-production-domain.com/api`)
   - Click **"Save"**

2. **Option 2: Create Environment (Recommended)**
   - Click **"Environments"** in the left sidebar
   - Click **"+"** to create a new environment
   - Name it (e.g., "Development", "Production")
   - Add a variable:
     - Variable: `base_url`
     - Initial Value: `http://localhost:3000/api`
     - Current Value: `http://localhost:3000/api`
   - Click **"Save"**
   - Select the environment from the dropdown (top right)

### Example Environments:

**Development:**
```
base_url = http://localhost:3000/api
```

**Production:**
```
base_url = https://your-domain.com/api
```

## Using the Collection

### 1. Start Your Server
Make sure your Next.js server is running:
```bash
npm run dev
```

### 2. Test an Endpoint
- Click on any request in the collection
- Click **"Send"** button
- View the response in the bottom panel

### 3. Update Dynamic Values
For endpoints with `:id` parameters:
- Replace `reservation-id-here` or `patient-id-here` with actual IDs
- You can get IDs from the "Get All Reservations" or "Get All Patients" responses

## Example Workflow

1. **Get All Reservations** - See current state
2. **Create Patient** - Add a new patient
3. **Create Reservation** - Book an appointment
4. **Mark as Arrived** - Move upcoming to waiting
5. **Start Treatment** - Begin treatment
6. **Finish Treatment** - Complete with notes
7. **Get All Reservations** - See updated state

## Tips

- **Save Responses**: Right-click on a request → "Save Response" → "Save as Example"
- **Create Folders**: Organize requests by feature
- **Add Tests**: Write automated tests in the "Tests" tab
- **Use Pre-request Scripts**: Automate token generation or data setup
- **Export Collection**: Share with your team via "Export" option

## Troubleshooting

### CORS Errors
- Make sure your server is running
- Check that CORS headers are properly set (already configured in your API routes)

### 404 Not Found
- Verify the base URL is correct
- Check that your server is running on the correct port

### 400 Bad Request
- Check the request body format
- Ensure required fields are provided
- Verify data types match the API requirements

### Connection Refused
- Make sure your Next.js dev server is running
- Check the port number (default is 3000)
- Verify firewall settings

## Collection Structure

```
Dentist Appointment Management API
├── Reservations
│   ├── Get All Reservations
│   ├── Create Reservation
│   ├── Start Treatment
│   ├── Mark as Arrived
│   ├── Cancel Reservation
│   ├── Cancel Reservation from History
│   └── Finish Treatment
└── Patients
    ├── Get All Patients
    ├── Search Patients
    ├── Create Patient
    ├── Update Patient
    └── Delete Patient
```

## Next Steps

1. Import the collection
2. Set up your environment variables
3. Start testing your APIs!
4. Customize requests as needed
5. Add tests for automated API testing
