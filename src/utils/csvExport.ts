import { InventoryItem, FarmTask } from '../types';

/**
 * Escapes CSV field value conforming to RFC 4180
 */
function escapeCsvValue(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Trigger browser file download with UTF-8 BOM
 */
export function triggerCsvDownload(filename: string, csvContent: string): void {
  // Prepend UTF-8 BOM (\uFEFF) so Excel & Sheets render UTF-8 characters properly
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export Inventory to standard CSV for agricultural record-keeping & tax compliance
 */
export function exportInventoryToCsv(
  inventory: InventoryItem[],
  farmerName = 'Registered Farmer',
  district = 'Karnataka'
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toLocaleString('en-IN');

  const headers = [
    'Item ID',
    'Item Name',
    'Agronomic Category',
    'Available Quantity',
    'Unit of Measure',
    'Cost Per Unit (INR)',
    'Total Valuation (INR)',
    'Reorder Threshold',
    'Stock Status',
    'Storage Facility / Location',
    'Last Audit Timestamp',
    'Tax / Subsidy Category',
    'Auditor / Field Notes'
  ];

  const rows = inventory.map(item => {
    const isLow = item.quantity <= item.minThreshold;
    const totalVal = item.quantity * item.costPerUnit;
    
    // Standard Indian Agricultural Income Tax / GST Classification
    let taxCategory = 'Exempt (Farm Input)';
    if (item.category === 'Fertilizers') {
      taxCategory = 'Fertilizer (DBT Subsidized / 5% GST Input)';
    } else if (item.category === 'Pesticides') {
      taxCategory = 'Pest Management (18% GST Input)';
    } else if (item.category === 'Seeds') {
      taxCategory = 'Certified Seed (0% GST / Sec 10(1) Exempt)';
    } else if (item.category === 'Tools & Equipment') {
      taxCategory = 'Capital Asset (Subsidized Farm Machinery)';
    } else if (item.category === 'Harvested Produce') {
      taxCategory = 'Farm Produce (Income Tax Exempt u/s 10(1))';
    }

    return [
      escapeCsvValue(item.id),
      escapeCsvValue(item.name),
      escapeCsvValue(item.category),
      escapeCsvValue(item.quantity),
      escapeCsvValue(item.unit),
      escapeCsvValue(item.costPerUnit.toFixed(2)),
      escapeCsvValue(totalVal.toFixed(2)),
      escapeCsvValue(item.minThreshold),
      escapeCsvValue(isLow ? 'LOW STOCK (REORDER NEEDED)' : 'HEALTHY INVENTORY'),
      escapeCsvValue(item.location),
      escapeCsvValue(item.lastUpdated || dateStr),
      escapeCsvValue(taxCategory),
      escapeCsvValue(item.notes || 'None')
    ].join(',');
  });

  const totalValuation = inventory.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);
  const totalItemsCount = inventory.length;

  const summaryRows = [
    '',
    [
      escapeCsvValue('SUMMARY TOTALS'),
      escapeCsvValue(`Total Item SKU Count: ${totalItemsCount}`),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue('Total Value:'),
      escapeCsvValue(totalValuation.toFixed(2)),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue('')
    ].join(','),
    '',
    `"--- NAMMAKRUSHI FARM FINANCIAL AUDIT REPORT ---"`,
    `"Report Generated:","${timestamp}"`,
    `"Farmer / Enterprise:","${farmerName}"`,
    `"District / Region:","${district}, Karnataka"`,
    `"Total Input Valuation:","INR ${totalValuation.toLocaleString('en-IN')}"`,
    `"Compliance Purpose:","Agricultural Income Tax Exemption (Sec 10(1)) & KCC Loan Audit"`
  ];

  const csvContent = [headers.join(','), ...rows, ...summaryRows].join('\r\n');
  const filename = `NammaKrushi_Farm_Inventory_${dateStr}.csv`;
  triggerCsvDownload(filename, csvContent);
}

/**
 * Export Field Operations & Tasks to CSV
 */
export function exportTasksToCsv(
  tasks: FarmTask[],
  farmerName = 'Registered Farmer',
  district = 'Karnataka'
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toLocaleString('en-IN');

  const headers = [
    'Task ID',
    'Activity Description',
    'Agronomic Category',
    'Scheduled Due Date',
    'Current Status',
    'Priority Level',
    'Field Sector / Zone',
    'Assigned Labor / Machinery',
    'Operational Dosage / Notes',
    'Audit Compliance Verification'
  ];

  const rows = tasks.map(task => {
    return [
      escapeCsvValue(task.id),
      escapeCsvValue(task.title),
      escapeCsvValue(task.category),
      escapeCsvValue(task.dueDate),
      escapeCsvValue(task.status.toUpperCase()),
      escapeCsvValue(task.priority),
      escapeCsvValue(task.fieldSector),
      escapeCsvValue(task.assignedTo || 'Unassigned'),
      escapeCsvValue(task.notes || 'Routine maintenance'),
      escapeCsvValue(task.status === 'Completed' ? 'VERIFIED EXECUTED' : 'PENDING EXECUTION')
    ].join(',');
  });

  const completedCount = tasks.filter(t => t.status === 'Completed').length;
  const pendingCount = tasks.filter(t => t.status === 'Pending').length;

  const summaryRows = [
    '',
    [
      escapeCsvValue('TOTAL SUMMARY'),
      escapeCsvValue(`Total Operations Logged: ${tasks.length}`),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue(`Completed: ${completedCount} | Pending: ${pendingCount}`),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue(''),
      escapeCsvValue('')
    ].join(','),
    '',
    `"--- NAMMAKRUSHI FIELD OPERATIONS AUDIT LOG ---"`,
    `"Generated At:","${timestamp}"`,
    `"Farmer Name:","${farmerName}"`,
    `"District:","${district}, Karnataka"`,
    `"Labor & Resource Utilization:","${completedCount} of ${tasks.length} tasks successfully verified"`,
    `"Record Keeping Standard:","APMC Good Agricultural Practices (GAP) & Organic Certification"`
  ];

  const csvContent = [headers.join(','), ...rows, ...summaryRows].join('\r\n');
  const filename = `NammaKrushi_Farm_Tasks_Log_${dateStr}.csv`;
  triggerCsvDownload(filename, csvContent);
}

/**
 * Export Combined Farm Audit & Tax Compliance CSV (Inventory + Tasks)
 */
export function exportCombinedFarmAuditCsv(
  inventory: InventoryItem[],
  tasks: FarmTask[],
  farmerName = 'Registered Farmer',
  district = 'Karnataka'
): void {
  const dateStr = new Date().toISOString().split('T')[0];
  const timestamp = new Date().toLocaleString('en-IN');
  const totalValuation = inventory.reduce((sum, item) => sum + (item.quantity * item.costPerUnit), 0);

  const lines: string[] = [];

  // Title Banner
  lines.push(`"=========================================================================="`);
  lines.push(`"NAMMAKRUSHI COMPREHENSIVE FARM AUDIT & TAX COMPLIANCE REPORT"`);
  lines.push(`"Generated on: ${timestamp} | Region: ${district}, Karnataka | Producer: ${farmerName}"`);
  lines.push(`"Statutory Compliance: Section 10(1) Income Tax Act 1961 (Agricultural Income)"`);
  lines.push(`"=========================================================================="`);
  lines.push('');

  // Section 1: Inventory Assets & Input Valuation
  lines.push(`"--- SECTION 1: FARM INVENTORY & CURRENT ASSET VALUATION ---"`);
  lines.push([
    'Item ID',
    'Item Name',
    'Category',
    'Quantity',
    'Unit',
    'Cost/Unit (INR)',
    'Total Valuation (INR)',
    'Threshold',
    'Storage Location',
    'Tax/Subsidy Category'
  ].map(h => escapeCsvValue(h)).join(','));

  inventory.forEach(item => {
    const totalVal = item.quantity * item.costPerUnit;
    lines.push([
      escapeCsvValue(item.id),
      escapeCsvValue(item.name),
      escapeCsvValue(item.category),
      escapeCsvValue(item.quantity),
      escapeCsvValue(item.unit),
      escapeCsvValue(item.costPerUnit.toFixed(2)),
      escapeCsvValue(totalVal.toFixed(2)),
      escapeCsvValue(item.minThreshold),
      escapeCsvValue(item.location),
      escapeCsvValue(item.notes || 'Farm asset')
    ].join(','));
  });

  lines.push([
    escapeCsvValue('TOTAL INVENTORY VALUE'),
    escapeCsvValue(''),
    escapeCsvValue(''),
    escapeCsvValue(''),
    escapeCsvValue(''),
    escapeCsvValue(''),
    escapeCsvValue(totalValuation.toFixed(2)),
    escapeCsvValue(''),
    escapeCsvValue(''),
    escapeCsvValue('')
  ].join(','));
  lines.push('');

  // Section 2: Field Labor & Task Activity Logs
  lines.push(`"--- SECTION 2: FIELD OPERATIONS & LABOR LOGS ---"`);
  lines.push([
    'Task ID',
    'Activity Description',
    'Category',
    'Due Date',
    'Status',
    'Priority',
    'Field Sector',
    'Assigned Labor/Machine',
    'Operational Details'
  ].map(h => escapeCsvValue(h)).join(','));

  tasks.forEach(task => {
    lines.push([
      escapeCsvValue(task.id),
      escapeCsvValue(task.title),
      escapeCsvValue(task.category),
      escapeCsvValue(task.dueDate),
      escapeCsvValue(task.status),
      escapeCsvValue(task.priority),
      escapeCsvValue(task.fieldSector),
      escapeCsvValue(task.assignedTo || 'Unassigned'),
      escapeCsvValue(task.notes || 'Routine operation')
    ].join(','));
  });

  lines.push('');
  lines.push(`"=========================================================================="`);
  lines.push(`"END OF AUDIT REPORT | Certified by NammaKrushi Smart Farm Management System"`);
  lines.push(`"=========================================================================="`);

  const csvContent = lines.join('\r\n');
  const filename = `NammaKrushi_Farm_Audit_Tax_Report_${dateStr}.csv`;
  triggerCsvDownload(filename, csvContent);
}
