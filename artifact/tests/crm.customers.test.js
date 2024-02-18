import { debug, expect, goal } from '../tst-helpers.js'

goal.todo('show me the first customer', async ({ result }) => {
  debug(result)

  // expect it to be not sure what to do
  // then we want to say "in my customers list, show me the first one"
  // it should be confused and say we dont' have any customers and suggest we
  // initialize a CRM.
})
goal.todo('add a new customer', async ({ result }) => {
  // we should provision the crm to disk first, then we can add a customer
  // also check adding a new customer once we have some customers already.
})
goal.todo('show me the list of customers')
goal.todo('who changed this customer last ?')
goal.todo('add a note to this customer')
goal.todo('add a note and make sure it stays private')
goal.todo('what is this customers balance ?')
goal.todo('is this customer synced with moneyworks ?')
goal.todo('when did this customer last sync with moneyworks ?')
goal.todo('what is this customers last invoice number ?')
goal.todo('save this change to moneyworks')
goal.todo('the template has changed - please update all the records')
