const response = await axios.post(`${API_BASE_URL}/auth/signup`, signupData);
console.error("Request URL:", `${API_BASE_URL}/auth/signup`);

onChange={(event, selectedDate) => {
  setShowDatePicker(false);
  if (selectedDate && event.type !== 'dismissed') {
    // Use local date parts to avoid UTC offset issues
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const localDate = `${year}-${month}-${day}`;
    updateFormData("dob", localDate);
  }
}} 