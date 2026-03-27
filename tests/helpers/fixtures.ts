export const customerFixture = {
  id: "cus_test123",
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  mobile_number: null,
  home_number: null,
  work_number: null,
  company: null,
  notifications_enabled: false,
  lead_source: null,
  notes: null,
  tags: [],
  addresses: [],
};

export const addressFixture = {
  id: "adr_test123",
  type: "service",
  street: "123 Test St",
  street_line_2: null,
  city: "Testville",
  state: "CA",
  zip: "90210",
  country: "US",
};

export const jobFixture = {
  id: "job_test123",
  invoice_number: "1",
  customer: customerFixture,
  address: addressFixture,
  work_status: "unscheduled",
  schedule: { scheduled_start: null, scheduled_end: null, arrival_window: 0, appointments: [] },
  notes: [],
  tags: [],
  assigned_employees: [],
  total_amount: 0,
  outstanding_balance: 0,
};

export const materialFixture = {
  id: "mat_test123",
  name: "Test Material",
  price: 10.99,
  unit_cost: 5.0,
  description: "A test material",
};

export const tagFixture = {
  id: "tag_test123",
  name: "test-tag",
};

export const priceBookServiceFixture = {
  id: "pbs_test123",
  name: "Test Service",
  description: "A test service",
  unit_price: 99.99,
  online_booking: false,
};

export const leadFixture = {
  id: "lead_test123",
  customer: customerFixture,
};

export const estimateFixture = {
  id: "est_test123",
  customer: customerFixture,
  address: addressFixture,
  work_status: "unscheduled",
};

export const eventFixture = {
  id: "evt_test123",
  name: "Test Event",
};

export const companyFixture = {
  id: "company_test123",
  name: "Test Company",
};

export const applicationFixture = {
  id: "app_test123",
  status: "active",
};

export const employeeFixture = {
  id: "emp_test123",
  first_name: "Jane",
  last_name: "Doe",
};

export const invoiceFixture = {
  id: "inv_test123",
  total: 100,
};

export const scheduleWindowFixture = {
  windows: [],
};

export const routeFixture = {
  id: "route_test123",
};

export const checklistFixture = {
  id: "checklist_test123",
};

export const priceFormFixture = {
  id: "pf_test123",
  name: "Test Form",
};

export const materialCategoryFixture = {
  id: "mc_test123",
  name: "Test Category",
};

export const jobTypeFixture = {
  id: "jt_test123",
  name: "Test Job Type",
};

export const leadSourceFixture = {
  id: "ls_test123",
  name: "Test Lead Source",
};

export const serviceZoneFixture = {
  id: "sz_test123",
  name: "Test Zone",
};

export const pipelineStatusFixture = {
  id: "ps_test123",
  name: "New",
  resource_type: "lead",
};

export const webhookFixture = {
  id: "wh_test123",
  url: "https://example.com/webhook",
};
