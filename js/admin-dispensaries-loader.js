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
      <button class="action-btn edit-btn edit-dispensary-btn" data-id="${dispensary.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      </button>
      <button class="action-btn delete-btn delete-dispensary-btn" data-id="${dispensary.id}">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          <line x1="10" y1="11" x2="10" y2="17"></line>
          <line x1="14" y1="11" x2="14" y2="17"></line>
        </svg>
      </button>
    </td>
  `;
  return row;
}
