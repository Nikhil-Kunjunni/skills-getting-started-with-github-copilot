document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
  const response = await fetch("/activities", { cache: 'no-store' });
      const activities = await response.json();

      // Clear loading message / existing cards
      activitiesList.innerHTML = "";

      // Clear existing options except placeholder
      activitySelect.querySelectorAll('option.activity-option')?.forEach(o => o.remove());

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = Math.max(0, details.max_participants - (details.participants?.length || 0));

        // Basic info
        const title = document.createElement("h4");
        title.textContent = name;

        const desc = document.createElement("p");
        desc.textContent = details.description;

        const schedule = document.createElement("p");
        schedule.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availability = document.createElement("p");
        availability.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(schedule);
        activityCard.appendChild(availability);

        // Participants section
        const participantsWrap = document.createElement("div");
        participantsWrap.className = "participants";

        const header = document.createElement("div");
        header.className = "participants-header";

        const hdrTitle = document.createElement("span");
        hdrTitle.textContent = "Participants";

        const hdrCount = document.createElement("span");
        hdrCount.className = "participants-count";
        hdrCount.textContent = (details.participants?.length || 0);

        header.appendChild(hdrTitle);
        header.appendChild(hdrCount);
        participantsWrap.appendChild(header);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";
          details.participants.forEach(p => {
            const li = document.createElement("li");
            li.className = 'participant-item';

            const nameSpan = document.createElement('span');
            nameSpan.textContent = p;
            nameSpan.className = 'participant-name';

            const delBtn = document.createElement('button');
            delBtn.className = 'participant-delete';
            delBtn.title = 'Unregister participant';
            delBtn.innerHTML = '\u2716'; // heavy multiplication X
            delBtn.addEventListener('click', async () => {
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`,
                  { method: 'DELETE' });
                if (!resp.ok) {
                  const err = await resp.json().catch(()=>({detail: resp.statusText}));
                  messageDiv.textContent = err.detail || 'Failed to unregister';
                  messageDiv.className = 'message error';
                  messageDiv.classList.remove('hidden');
                  setTimeout(()=>messageDiv.classList.add('hidden'), 4000);
                  return;
                }
                const data = await resp.json().catch(()=>({message:'Unregistered'}));
                messageDiv.textContent = data.message || 'Unregistered successfully';
                messageDiv.className = 'message success';
                messageDiv.classList.remove('hidden');
                // Refresh activities
                await fetchActivities();
              } catch (err) {
                messageDiv.textContent = 'Network error while unregistering';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
              }
            });

            li.appendChild(nameSpan);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });
          participantsWrap.appendChild(ul);
        } else {
          const none = document.createElement("div");
          none.className = "no-participants";
          none.textContent = "No participants yet.";
          participantsWrap.appendChild(none);
        }

        activityCard.appendChild(participantsWrap);
        activitiesList.appendChild(activityCard);

        // Add option to select dropdown (avoid duplicates)
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        option.className = "activity-option";
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json().catch(() => ({}));

      if (response.ok) {
        messageDiv.textContent = result.message || "Signed up successfully";
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities to show updated participants
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
