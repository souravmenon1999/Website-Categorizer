import React, { useState, useEffect } from 'react';
import './UrlApiPage.css'; // Import CSS file for styling

// Create a function to extract the last element from the "Category name" in a JSON object
const extractLastElementFromCategory = (jsonObject, key) => {
  if (jsonObject[key] && Array.isArray(jsonObject[key][0])) {
    const categoryArray = jsonObject[key][0];

    // Find the element that contains "Category name:"
    const desiredCategory = categoryArray.find((item) => item.includes("Category name:"));

    if (desiredCategory) {
      // Extract the "Category name" from the found element
      const categoryParts = desiredCategory.split("Category name: ")[1];
      
      // Split the "Category name" using the ">" character
      const categoryPartsArray = categoryParts.split(" > ");
      
      // Get the last element in the array
      const lastCategoryPart = categoryPartsArray[categoryPartsArray.length - 1];
      
      return lastCategoryPart;
    }
  }

  return null; // Category not found in the JSON object or key doesn't exist
};

function UrlApiPage() {
  const [url, setUrl] = useState('');
  const [filteringTaxonomy, setFilteringTaxonomy] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [apiResponse, setApiResponse] = useState(null); // Initialize to null
  const [lastIabCategory, setLastIabCategory] = useState('');
  const [studyStartTime, setStudyStartTime] = useState('09:00'); // Default start time
  const [studyEndTime, setStudyEndTime] = useState('17:00'); // Default end time
  const [studyTimeEnabled, setStudyTimeEnabled] = useState(false);

  const handleInputChange = (e) => {
    setUrl(e.target.value);
    // Clear any previous error messages, filtering taxonomy, and API response when input changes
    setErrorMessage('');
    setFilteringTaxonomy([]);
    setApiResponse(null);
  };

  const handleOpenUrl = async () => {
    try {
      if (studyTimeEnabled) {
        setErrorMessage("Study time is enabled. You cannot open websites during this time.");
        return;
      }

      if (url.trim() !== '') {
        fetchFilteringTaxonomy();
      }
    } catch (error) {
      console.error('API call error:', error);
    }
  };

  const fetchFilteringTaxonomy = async () => {
    try {
      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

      const urlencoded = new URLSearchParams();
      urlencoded.append("query", url);
      urlencoded.append("api_key", "a12");
      urlencoded.append("data_type", "url");

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: urlencoded,
        redirect: 'follow'
      };

      const response = await fetch("https://www.websitecategorizationapi.com/api/iab/iab_content_filtering.php", requestOptions);
      const result = await response.json(); // Parse JSON response

      console.log('API Response:', result);

      if (result && result.filtering_taxonomy && Array.isArray(result.filtering_taxonomy) && result.filtering_taxonomy.length > 0) {
        // Check if the category is "Adult"
        if (result.filtering_taxonomy[0].includes("Category name: Adult")) {
          setErrorMessage("Cannot open the page. Category is 'Adult'.");
          return; // Stop further processing
        }

        // Open the URL in a new tab or window
        window.open(url, '_blank');

        // Extract the last element from the "IAB taxonomy"
        const lastCategoryElement = extractLastElementFromCategory(result, "iab_taxonomy");

        setLastIabCategory(lastCategoryElement);

        // Set the filtering_taxonomy array as the state
        setFilteringTaxonomy(result.filtering_taxonomy[0]);

        // Set the API response (excluding sensitive information)
        const filteredApiResponse = {
          iab_taxonomy: result.iab_taxonomy,
          content_taxonomy: result.content_taxonomy,
          classification: result.classification,
          category: result.category,
          status: result.status,
          total_credits: result.total_credits,
          remaining_credits: result.remaining_credits,
        };

        setApiResponse(filteredApiResponse);
      } else {
        setErrorMessage("Invalid API response format.");
      }
    } catch (error) {
      console.error('API call error:', error);
    }
  };

  const handleResetTime = () => {
    setStudyStartTime('09:00');
    setStudyEndTime('17:00');
    setStudyTimeEnabled(false);
    // Clear filtering taxonomy, error message, API response, and last IAB category when resetting time
    setFilteringTaxonomy([]);
    setErrorMessage('');
    setApiResponse(null);
    setLastIabCategory('');
  };

  useEffect(() => {
    // Get the current time
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();

    // Convert study start and end times to hours and minutes
    const [studyStartHour, studyStartMinute] = studyStartTime.split(':').map(Number);
    const [studyEndHour, studyEndMinute] = studyEndTime.split(':').map(Number);

    // Check if the current time is within the study time range
    if (
      (currentHour > studyStartHour || (currentHour === studyStartHour && currentMinute >= studyStartMinute)) &&
      (currentHour < studyEndHour || (currentHour === studyEndHour && currentMinute < studyEndMinute))
    ) {
      setStudyTimeEnabled(true);
    } else {
      setStudyTimeEnabled(false);
    }
  }, [studyStartTime, studyEndTime]);

  return (
    <div className="container">
      <h2>URL API Page</h2>
      <div>
        <label className="label">Study Start Time:</label>
        <input
          type="time"
          value={studyStartTime}
          onChange={(e) => setStudyStartTime(e.target.value)}
        />
      </div>
      <div>
        <label className="label">Study End Time:</label>
        <input
          type="time"
          value={studyEndTime}
          onChange={(e) => setStudyEndTime(e.target.value)}
        />
      </div>
      <input
        type="text"
        placeholder="Enter URL"
        value={url}
        onChange={handleInputChange}
        className="input"
      />
      <button onClick={handleOpenUrl} className="button">Open URL</button>
      <button onClick={handleResetTime} className="button">Reset Time</button>
      <div>
        {errorMessage && (
          <div className="error-message">{errorMessage}</div>
        )}
      </div>
      <div>
        <h3>Filtering Taxonomy:</h3>
        <ul>
          {filteringTaxonomy.map((item, index) => (
            <li key={index} className="taxonomy-item">{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Last IAB Category:</h3>
        <p>{lastIabCategory}</p>
      </div>
      <div>
        <h3>API Response (Partial):</h3>
        {apiResponse && (
          <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
        )}
      </div>
    </div>
  );
}

export default UrlApiPage;
