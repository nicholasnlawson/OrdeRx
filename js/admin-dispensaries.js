/**
 * Admin Dispensaries Management
 *
 * Handles client-side logic for the dispensary management in the admin panel.
 */

document.addEventListener('DOMContentLoaded', () => {
  const addDispensaryBtn = document.getElementById('add-dispensary-btn');
  const dispensaryModal = document.getElementById('dispensary-modal');
  const dispensaryModalTitle = document.getElementById('dispensary-modal-title');
  const dispensaryForm = document.getElementById('dispensary-form');
  const dispensaryIdField = document.getElementById('dispensary-id');
  const dispensaryNameField = document.getElementById('dispensary-name');
  const dispensaryDescriptionField = document.getElementById('dispensary-description');
  const dispensaryHospitalIdField = document.getElementById('dispensary-hospital-id');
  const dispensariesTableBody = document.getElementById('dispensaries-table-body');
  const confirmDeleteDispensaryModal = document.getElementById('confirm-delete-dispensary-modal');
  const deleteDispensaryIdField = document.getElementById('delete-dispensary-id');
  const confirmDeleteDispensaryBtn = document.getElementById('confirm-delete-dispensary-btn');

  let hospitals = [];

  // Function to open the dispensary modal for adding/editing
  const openDispensaryModal = (dispensary = null) => {
    dispensaryForm.reset();
    populateHospitalDropdown();

    if (dispensary) {
      dispensaryModalTitle.textContent = 'Edit Dispensary';
      dispensaryIdField.value = dispensary.id;
      dispensaryNameField.value = dispensary.name;
      dispensaryDescriptionField.value = dispensary.description || '';
      dispensaryHospitalIdField.value = dispensary.hospital_id || '';
    } else {
      dispensaryModalTitle.textContent = 'Add New Dispensary';
      dispensaryIdField.value = '';
    }
    dispensaryModal.style.display = 'block';
  };

  // Function to close modals
  const closeModal = (modal) => {
    modal.style.display = 'none';
  };

  // Fetch all dispensaries and render them in the table
  const fetchAndRenderDispensaries = async () => {
    try {
      const data = await apiClient.get('/dispensaries');
      const dispensaries = data.dispensaries;
      dispensariesTableBody.innerHTML = ''; // Clear existing rows

      if (dispensaries.length === 0) {
        dispensariesTableBody.innerHTML = '<tr><td colspan="4">No dispensaries found.</td></tr>';
        return;
      }

      dispensaries.forEach(dispensary => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${dispensary.name}</td>
          <td>${dispensary.description || 'N/A'}</td>
          <td>${dispensary.hospital_name || 'N/A'}</td>
          <td class="actions">
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
        dispensariesTableBody.appendChild(row);
      });
    } catch (error) {
      console.error('Error fetching dispensaries:', error);
      dispensariesTableBody.innerHTML = '<tr><td colspan="4">Error loading dispensaries.</td></tr>';
    }
  };

  // Fetch hospitals and populate the dropdown
  const populateHospitalDropdown = async () => {
    if (hospitals.length === 0) {
      try {
        const data = await apiClient.get('/hospitals');
        hospitals = data.hospitals;
      } catch (error) {
        console.error('Error fetching hospitals:', error);
        return;
      }
    }

    dispensaryHospitalIdField.innerHTML = '<option value="">None</option>';
    hospitals.forEach(hospital => {
      const option = document.createElement('option');
      option.value = hospital.id;
      option.textContent = hospital.name;
      dispensaryHospitalIdField.appendChild(option);
    });
  };

  // Event listener for form submission (add/edit dispensary)
  dispensaryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const dispensaryId = dispensaryIdField.value;
    const dispensaryData = {
      name: dispensaryNameField.value,
      description: dispensaryDescriptionField.value,
      hospital_id: dispensaryHospitalIdField.value || null
    };

    try {
      if (dispensaryId) {
        // Update existing dispensary
        await apiClient.put(`/dispensaries/${dispensaryId}`, dispensaryData);
      } else {
        // Create new dispensary
        await apiClient.post('/dispensaries', dispensaryData);
      }
      closeModal(dispensaryModal);
      fetchAndRenderDispensaries();
    } catch (error) {
      console.error('Error saving dispensary:', error);
      alert('Failed to save dispensary. Please check the console for details.');
    }
  });

  // Event delegation for edit and delete buttons
  dispensariesTableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('edit-dispensary-btn')) {
      const dispensaryId = e.target.dataset.id;
      try {
        const data = await apiClient.get(`/dispensaries/${dispensaryId}`);
        openDispensaryModal(data.dispensary);
      } catch (error) {
        console.error('Error fetching dispensary details:', error);
      }
    } else if (e.target.classList.contains('delete-dispensary-btn')) {
      const dispensaryId = e.target.dataset.id;
      deleteDispensaryIdField.value = dispensaryId;
      confirmDeleteDispensaryModal.style.display = 'block';
    }
  });

  // Event listener for confirm delete button
  confirmDeleteDispensaryBtn.addEventListener('click', async () => {
    const dispensaryId = deleteDispensaryIdField.value;
    try {
      await apiClient.delete(`/dispensaries/${dispensaryId}`);
      closeModal(confirmDeleteDispensaryModal);
      fetchAndRenderDispensaries();
    } catch (error) {
      console.error('Error deleting dispensary:', error);
      alert('Failed to delete dispensary.');
    }
  });

  // Event listeners for opening and closing modals
  addDispensaryBtn.addEventListener('click', () => openDispensaryModal());

  [dispensaryModal, confirmDeleteDispensaryModal].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('close-btn') || e.target.classList.contains('close-modal')) {
        closeModal(modal);
      }
    });
  });

  // Initial load of dispensaries
  if (window.location.pathname.includes('/admin/index.html')) {
    fetchAndRenderDispensaries();
  }
});
