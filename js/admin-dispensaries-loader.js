/**
 * Admin Panel - Dispensary Data Loading
 */

async function loadDispensaries() {
  const dispensaryTableBody = document.getElementById('dispensaries-table-body');
  if (!dispensaryTableBody) {
    console.warn('Dispensary table body not found on this page.');
    return;
  }

  try {
    const response = await apiClient.getDispensaries();
    if (!response || !response.dispensaries) {
      console.error('Invalid API response format for dispensaries:', response);
      return;
    }

    const dispensaries = response.dispensaries;
    dispensaryTableBody.innerHTML = ''; // Clear existing rows

    if (dispensaries.length === 0) {
        dispensaryTableBody.innerHTML = '<tr><td colspan="4">No dispensaries found.</td></tr>';
        return;
    }

    dispensaries.forEach(dispensary => {
      const row = renderDispensaryRow(dispensary);
      dispensaryTableBody.appendChild(row);
    });

  } catch (error) {
    console.error('Error loading dispensaries:', error);
    if (dispensaryTableBody) {
        dispensaryTableBody.innerHTML = '<tr><td colspan="4" class="error-message">Error loading dispensaries.</td></tr>';
    }
  }
}

function renderDispensaryRow(dispensary) {
  const row = document.createElement('tr');
  row.innerHTML = `
    <td>${dispensary.name || 'N/A'}</td>
    <td>${dispensary.description || ''}</td>
    <td>${dispensary.hospital_name || 'N/A'}</td>
    <td>
      <button class="btn btn-sm btn-secondary edit-dispensary-btn" data-id="${dispensary.id}">Edit</button>
      <button class="btn btn-sm btn-danger delete-dispensary-btn" data-id="${dispensary.id}">Delete</button>
    </td>
  `;
  return row;
}
