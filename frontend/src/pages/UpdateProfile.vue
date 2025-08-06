<template>
  <div class="update-profile">
    <div class="page-header">
      <h1>Update Profile</h1>
      <p class="text-muted">Manage your personal information and account settings</p>
    </div>

    <div class="profile-form-container">
      <form @submit.prevent="handleSubmit" class="profile-form">
        <!-- Profile Picture Section -->
        <div class="profile-picture-section">
          <div class="profile-avatar">
            <img 
              :src="profileData.avatar || '/images/default-avatar.png'" 
              :alt="profileData.full_name"
              class="avatar-image"
            />
            <div class="avatar-overlay">
              <input 
                type="file" 
                ref="fileInput" 
                @change="handleFileUpload" 
                accept="image/*" 
                class="file-input"
              />
              <button type="button" @click="$refs.fileInput.click()" class="change-photo-btn">
                <i class="fa fa-camera"></i>
                Change Photo
              </button>
            </div>
          </div>
        </div>

        <!-- Personal Information -->
        <div class="form-section">
          <h3>Personal Information</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="firstName">First Name *</label>
              <input 
                type="text" 
                id="firstName"
                v-model="profileData.first_name" 
                required 
                class="form-control"
                :disabled="loading"
              />
            </div>
            
            <div class="form-group">
              <label for="lastName">Last Name</label>
              <input 
                type="text" 
                id="lastName"
                v-model="profileData.last_name" 
                class="form-control"
                :disabled="loading"
              />
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="email">Email Address *</label>
              <input 
                type="email" 
                id="email"
                v-model="profileData.email" 
                required 
                class="form-control"
                :disabled="loading"
              />
            </div>
            
            <div class="form-group">
              <label for="mobile">Mobile Number</label>
              <input 
                type="tel" 
                id="mobile"
                v-model="profileData.mobile_no" 
                class="form-control"
                :disabled="loading"
              />
            </div>
          </div>

          <div class="form-group">
            <label for="bio">Bio</label>
            <textarea 
              id="bio"
              v-model="profileData.bio" 
              class="form-control"
              rows="3"
              placeholder="Tell us about yourself..."
              :disabled="loading"
            ></textarea>
          </div>
        </div>

        <!-- Account Settings -->
        <div class="form-section">
          <h3>Account Settings</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label for="language">Language</label>
              <select 
                id="language"
                v-model="profileData.language" 
                class="form-control"
                :disabled="loading"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="timezone">Timezone</label>
              <select 
                id="timezone"
                v-model="profileData.time_zone" 
                class="form-control"
                :disabled="loading"
              >
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="Europe/London">London</option>
                <option value="Europe/Paris">Paris</option>
                <option value="Asia/Tokyo">Tokyo</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <div class="checkbox-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="profileData.email_notifications"
                  :disabled="loading"
                />
                <span class="checkmark"></span>
                Receive email notifications
              </label>
              
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  v-model="profileData.newsletter_subscription"
                  :disabled="loading"
                />
                <span class="checkmark"></span>
                Subscribe to newsletter
              </label>
            </div>
          </div>
        </div>

        <!-- Form Actions -->
        <div class="form-actions">
          <button 
            type="button" 
            @click="resetForm" 
            class="btn btn-secondary"
            :disabled="loading"
          >
            Reset Changes
          </button>
          
          <button 
            type="submit" 
            class="btn btn-primary"
            :disabled="loading || !hasChanges"
          >
            <i v-if="loading" class="fa fa-spinner fa-spin"></i>
            {{ loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Success/Error Messages -->
    <div v-if="message" :class="['alert', messageType === 'success' ? 'alert-success' : 'alert-error']">
      {{ message }}
    </div>
  </div>
</template>

<script>
import { session } from '../data/session'
import { userResource, updateUserResource } from '../data/user'


export default {
  name: 'UpdateProfile',
  data() {
    return {
      loading: false,
      message: '',
      messageType: 'success',
      originalData: {},
      profileData: {
        first_name: '',
        last_name: '',
        email: '',
        mobile_no: '',
        bio: '',
        language: 'en',
        time_zone: 'UTC',
        email_notifications: true,
        newsletter_subscription: false,
        avatar: ''
      }
    }
  },
  computed: {
    hasChanges() {
      return JSON.stringify(this.profileData) !== JSON.stringify(this.originalData)
    }
  },
  async mounted() {
    await this.loadProfile()
  },
  methods: {
    async loadProfile() {
      this.loading = true
      try {
        // Replace with your actual API call
        if (!userResource?.load) {
          console.warn('userResource.load is not available')
          return
        }
        const response = await userResource.load()

        
        this.profileData = {
          first_name: response.first_name || '',
          last_name: response.last_name || '',
          email: response.email || '',
          mobile_no: response.mobile_no || '',
          bio: response.bio || '',
          language: response.language || 'en',
          time_zone: response.time_zone || 'UTC',
          email_notifications: response.email_notifications !== false,
          newsletter_subscription: response.newsletter_subscription || false,
          avatar: response.user_image || ''
        }
        
        // Store original data for comparison
        this.originalData = { ...this.profileData }
        
      } catch (error) {
        console.error('Failed to load profile:', error)
        this.showMessage('Failed to load profile data', 'error')
      } finally {
        this.loading = false
      }
    },
    
    async handleSubmit() {
      this.loading = true
      this.message = ''
      
      try {
        // Replace with your actual API call
        await updateUserResource.submit({
          doc: this.profileData
        })
        // Update original data after successful save      
        this.originalData = { ...this.profileData }
        this.showMessage('Profile updated successfully!', 'success')


        
      } catch (error) {
        console.error('Failed to update profile:', error)
        this.showMessage('Failed to update profile. Please try again.', 'error')
      } finally {
        this.loading = false
      }
    },
    
    resetForm() {
      this.profileData = { ...this.originalData }
      this.message = ''
    },

    
    async handleFileUpload(event) {
      const file = event.target.files[0]
      if (!file) return
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        this.showMessage('Please select a valid image file', 'error')
        return
      }
      
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        this.showMessage('Image size should be less than 2MB', 'error')
        return
      }
      
      this.loading = true
      try {
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('file', file)
        formData.append('is_private', 0)
        
        // Replace with your actual file upload API call
        const response = await fetch('/api/method/upload_file', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        if (result.message) {
          this.profileData.avatar = result.message.file_url
          this.showMessage('Profile picture updated!', 'success')
        }
        
      } catch (error) {
        console.error('Failed to upload image:', error)
        this.showMessage('Failed to upload image', 'error')
      } finally {
        this.loading = false
      }
    },
    
    showMessage(text, type) {
      this.message = text
      this.messageType = type
      setTimeout(() => {
        this.message = ''
      }, 5000)
    }
  }
}
</script>

<style scoped>
.update-profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.page-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-weight: 600;
}

.text-muted {
  color: #6c757d;
  margin: 0;
}

.profile-form-container {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.profile-form {
  padding: 30px;
}

.profile-picture-section {
  display: flex;
  justify-content: center;
  margin-bottom: 40px;
}

.profile-avatar {
  position: relative;
  width: 120px;
  height: 120px;
}

.avatar-image {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #e9ecef;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.profile-avatar:hover .avatar-overlay {
  opacity: 1;
}

.file-input {
  display: none;
}

.change-photo-btn {
  background: transparent;
  border: none;
  color: white;
  font-size: 12px;
  cursor: pointer;
  text-align: center;
}

.change-photo-btn i {
  display: block;
  margin-bottom: 4px;
  font-size: 20px;
}

.form-section {
  margin-bottom: 30px;
}

.form-section h3 {
  margin: 0 0 20px 0;
  color: #495057;
  font-size: 18px;
  font-weight: 500;
  border-bottom: 2px solid #e9ecef;
  padding-bottom: 8px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #495057;
}

.form-control {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-control:disabled {
  background-color: #f8f9fa;
  opacity: 0.6;
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: normal;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 10px;
  transform: scale(1.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding-top: 20px;
  border-top: 1px solid #e9ecef;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 120px;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.alert {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 4px;
  font-weight: 500;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

@media (max-width: 768px) {
  .update-profile {
    padding: 10px;
  }
  
  .profile-form {
    padding: 20px;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .form-actions {
    flex-direction: column-reverse;
  }
  
  .btn {
    width: 100%;
  }
}
</style>