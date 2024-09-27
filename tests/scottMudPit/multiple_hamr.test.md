---
target: agents/hamr.md
assessor: agents/test-assessor.md
iterations: 1
---

### Tests for CUSTOMER_AGENT Actions

---

# Test: Create Customer
## ID
TST-CUSTAG-001
## Description
Ensure that a customer agent can create a new customer record.

**Prompts:**
```
create customer with the following details: John Doe, 124 Hope St, Auckland.  Mobile: 07777 777777.  Email: johndoe@test.com
```
**Expections:**
- Customer record is created successfully.

---

# Test: Update Customer Details
## ID
TST-CUSTAG-002
## Description
Ensure that a customer agent can update an existing customer's details.
**Prompts:**
```
update John Doe's Address to 123 Hope St.
```
**Expections:**
- Customer details are updated in the system.

---

# Test: View Customer Record
## ID
TST-CUSTAG-003
## Description
Ensure that a customer agent can view a customer's record.
**Prompts:**
```
What address is John Doe at?
```
**Expections:**
- Customer record information is displayed accurately.

---

# Test: Schedule Pickup
## ID
TST-CUSTAG-004
## Description
Ensure that a customer agent can schedule a pickup for a customer.
**Prompts:**
```
Schedule a pickup for <use an existing customer name here> for next Tuesday.
```
**Expections:**
- Pickup schedule is confirmed and saved.

---

# Test: Manage Customer Interactions
## ID
TST-CUSTAG-005
## Description
Ensure that a customer agent can log interactions with customers.
**Prompts:**
```
<Insert existing Customer Name> has just given the following feedback:  "I love you guys"
```
**Expections:**
- Interaction note is saved successfully.

---

# Test: Request Permission for Actions
## ID
TST-CUSTAG-006
## Description
Ensure that a customer agent can request permissions for certain actions.
**Prompts:**
```
request permission to access customer data
```
**Expections:**
- Permission request is submitted and logged.

---

# Test: Access Customer Feedback
## ID
TST-CUSTAG-007
## Description
Ensure that a customer agent can access customer feedback records.
**Prompts:**
```
View feedback for <insert existing customer name>
```
**Expections:**
- Feedback log from that customer is displayed.

---

# Test: Update Customer Status
## ID
TST-CUSTAG-008
## Description
Ensure that a customer agent can update a customer's status.
**Prompts:**
```
Update status for <insert existing customer name> to paused.
```
**Expections:**
- Customer status is updated in the system.

---

# Test: Notify Customer of Updates
## ID
TST-CUSTAG-009
## Description
Ensure that a customer agent can send notifications to customers.  Note: currently there is no method to send the notification, and so it must be saved in the Feedback log.

**Prompts:**
```
Add to the Feedback log for <insert existing customer name> the following:  "Thank you for your request.  We'll be right back"
```
**Expections:**
- Notification is logged.

---

### Tests for CUSTOMER Actions

---

# Test: Request Pickup
## ID
TST-CUST-001
## Description
Ensure that a customer can view their own details.  
**Prompts:**
```
Show my account details
```
**Expections:**
- Customer record is displayed, including scheduled pick-ups.
- Feedback log is displayed.

---

# Test: View Pickup Request Status
## ID
TST-CUST-002
## Description
Ensure that a customer can view the status of their pickup request.  Note: use an existing customer.

**Prompts:**
```
Check my pick-up status
```
**Expections:**
- Status for the chosen existing customer is accurately displayed (e.g., scheduled, completed).

---

# Test: View Service Offerings
## ID
TST-CUST-009
## Description
Ensure that a customer can view available services offered by the company.  Note: use an existing customer.
**Prompts:**
```
What dates do you have available for pickup from my location?
```
**Expections:**
- A list of services is displayed to the customer.

---

# Test: Inquire About Service Problems
## ID
TST-CUST-010
## Description
Ensure that a customer can inquire about changes to service policies.  Note: use an existing customer.
**Prompts:**
```
I didn't get a pick-up this morning.  Is there a problem?
```
**Expections:**
- Customer receives accurate information about current schedule to their location, and any issues from the log.

---



### Tests for DRIVER Actions

---

# Test: Drive Truck
## ID
TST-DRIVER-001
## Description
Ensure that a driver can successfully drive a truck on a scheduled date. Note: use an existing driver.
**Prompts:**
```
Can <insert existing driver name> drive truck 1 for insert schedule with date.
```
**Expections:**
- The driver is available to dive that scheduled route.

---

# Test: Update Pickup Status
## ID
TST-DRIVER-002
## Description
Ensure that a driver can update the status of a pickup. Note: use an existing driver.
**Prompts:**
```
Update status of <insert existing pickup> to completed
```
**Expections:**
- Pickup status is updated accordingly.

---

# Test: Retrieve Truck Information
## ID
TST-DRIVER-003
## Description
Ensure that a driver can retrieve the information of the truck they are assigned to.  Note: use an existing driver and truck.
**Prompts:**
```
Get info for <insert truck>
```
**Expections:**
- Information about truck is displayed.

---

# Test: Report Problems with Truck
## ID
TST-DRIVER-004
## Description
Ensure that a driver can report issues encountered with their truck.  Note: use an existing driver and truck.
**Prompts:**
```
<Existing truck> has a flat tyre and is out of operation.
```
**Expections:**
- Issue is recorded and flagged for maintenance.

---

# Test: Confirm Pickup Completion
## ID
TST-DRIVER-005
## Description
Ensure that a driver can confirm that a pickup has been completed. Note: use an existing driver and schedule.
**Prompts:**
```
Confirm completion of all pickups on <insert schedule>
```
**Expections:**
- Confirmation is recorded in the system.

---

# Test: Request Assistance
## ID
TST-DRIVER-006
## Description
Ensure that a driver can request assistance while on a route.
**Prompts:**
```
Request assistance on route 1
```
**Expections:**
- Request for assistance is logged.

---

# Test: View Scheduled Routes
## ID
TST-DRIVER-007
## Description
Ensure that a driver can view their scheduled routes for the day.
**Prompts:**
```
view scheduled routes for today
```
**Expections:**
- Scheduled routes are displayed accurately.

---

# Test: Log Driving Hours
## ID
TST-DRIVER-008
## Description
Ensure that a driver can log their driving hours for the day.
**Prompts:**
```
log driving hours for today
```
**Expections:**
- Driving hours are recorded successfully.

---

# Test: Check Vehicle Maintenance Status
## ID
TST-DRIVER-009
## Description
Ensure that a driver can check if their assigned vehicle needs maintenance.
**Prompts:**
```
check maintenance status for truck 1
```
**Expections:**
- Maintenance status is displayed clearly.

---

# Test: Get Updates on Routes
## ID
TST-DRIVER-010
## Description
Ensure that a driver can receive updates on their routes.
**Prompts:**
```
get updates on routes
```
**Expections:**
- Updates for routes are provided to the driver.

---

### Tests for DUTY_MANAGER Actions

---

# Test: Approve Permission Request
## ID
TST-DM-001
## Description
Ensure that a Duty Manager can approve permission requests raised by agents.
**Prompts:**
```
approve permission request 1
```
**Expections:**
- Permission request is successfully approved.

---

# Test: Update Route
## ID
TST-DM-002
## Description
Ensure that a Duty Manager can update a route.
**Prompts:**
```
update route 1 details
```
**Expections:**
- Route details are updated in the system.

---

# Test: Log Issue with Schedule
## ID
TST-DM-003
## Description
Ensure that a Duty Manager can log an issue related to a schedule.
**Prompts:**
```
log issue with schedule 1
```
**Expections:**
- Issue is recorded and tracked.

---

# Test: Add New Truck
## ID
TST-DM-004
## Description
Ensure that a Duty Manager can add a new truck to the system.
**Prompts:**
```
add new truck details
```
**Expections:**
- New truck is successfully added to the fleet.

---

# Test: Remove Driver from System
## ID
TST-DM-005
## Description
Ensure that a Duty Manager can remove a driver from the system.
**Prompts:**
```
remove driver 1
```
**Expections:**
- Driver is successfully removed from the system.

---

# Test: View All Permissions
## ID
TST-DM-006
## Description
Ensure that a Duty Manager can view all current permissions requests.
**Prompts:**
```
view all permissions
```
**Expections:**
- List of all permissions is displayed accurately.

---

# Test: Send Message to Agent
## ID
TST-DM-007
## Description
Ensure that a Duty Manager can send messages to customer agents.
**Prompts:**
```
send message to agent 1
```
**Expections:**
- Message is sent and logged successfully.

---

# Test: Access Truck Maintenance Records
## ID
TST-DM-008
## Description
Ensure that a Duty Manager can access maintenance records of trucks.
**Prompts:**
```
view maintenance records for truck 1
```
**Expections:**
- Maintenance records are displayed accurately.

---

# Test: Generate Operational Reports
## ID
TST-DM-009
## Description
Ensure that a Duty Manager can generate reports on operations.
**Prompts:**
```
generate operational report
```
**Expections:**
- Report is generated and available for download.

---

# Test: Clear Log of Actions
## ID
TST-DM-010
## Description
Ensure that a Duty Manager can clear logs of actions taken.
**Prompts:**
```
clear action logs
```
**Expections:**
- Log entries are cleared successfully.

---

