<template>
  <div class="update-profile">
    <!-- Loading state -->
    <div v-if="userProfile.loading" class="flex justify-center items-center py-8">
      <LoadingText text="Loading profile..." />
    </div>

    <!-- Error state -->
    <div
      v-else-if="userProfile.error"
      class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
    >
      <h3 class="text-red-800 font-medium">Error Loading Profile</h3>
      <p class="text-red-600 text-sm mt-1">{{ userProfile.error.message }}</p>
      <Button @click="userProfile.fetch()" class="mt-3" variant="outline" size="sm">
        Try Again
      </Button>
    </div>

    <!-- Profile form -->
    <div v-else-if="userProfile.data" class="space-y-6">
      <!-- Avatar Section -->
      <Card class="p-6">
        <h3 class="text-lg font-medium mb-4">Profile Picture</h3>
        <div class="flex items-center space-x-4">
          <div
            class="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden"
          >
            <img
              v-if="userProfile.data.avatar || userProfile.data.user_image"
              :src="userProfile.data.avatar || userProfile.data.user_image"
              :alt="userProfile.data.full_name || userProfile.data.first_name"
              class="w-full h-full object-cover"
            />
            <span v-else class="text-gray-500 text-sm">
              {{ getInitials(userProfile.data.full_name || userProfile.data.first_name || "U") }}
            </span>
          </div>
          <div>
            <Button variant="outline" size="sm"> Change Avatar </Button>
            <p class="text-sm text-gray-500 mt-1">
              JPG, PNG or GIF. Max size 2MB.
            </p>
          </div>
        </div>
      </Card>

      <!-- Basic Information -->
      <Card class="p-6">
        <h3 class="text-lg font-medium mb-4">Basic Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormControl
            label="First Name"
            v-model="form.first_name"
            :placeholder="userProfile.data.first_name || 'Enter first name'"
          />
          <FormControl
            label="Last Name"
            v-model="form.last_name"
            :placeholder="userProfile.data.last_name || 'Enter last name'"
          />
          <FormControl
            label="Email"
            type="email"
            :model-value="userProfile.data.email"
            disabled
            class="opacity-75"
          />
          <FormControl
            label="Mobile"
            v-model="form.mobile_no"
            :placeholder="userProfile.data.mobile_no || 'Enter mobile number'"
          />
        </div>
      </Card>

      <!-- Additional Information -->
      <Card class="p-6">
        <h3 class="text-lg font-medium mb-4">Additional Information</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormControl
            label="Bio"
            type="textarea"
            v-model="form.bio"
            :placeholder="userProfile.data.bio || 'Tell us about yourself'"
            class="md:col-span-2"
          />
          <FormControl
            label="Location"
            v-model="form.location"
            :placeholder="userProfile.data.location || 'Enter your location'"
          />
          <FormControl
            label="Website"
            v-model="form.website"
            :placeholder="userProfile.data.website || 'Enter your website'"
          />
        </div>
      </Card>

      <!-- Actions -->
      <div class="flex justify-end space-x-3">
        <Button variant="outline" @click="resetForm"> Cancel </Button>
        <Button
          @click="saveProfile"
          :loading="updateProfile.loading"
          :disabled="!hasChanges"
        >
          Save Changes
        </Button>
      </div>
    </div>

    <!-- No data state -->
    <div v-else class="text-center py-8">
      <p class="text-gray-500">Unable to load profile data</p>
      <Button @click="userProfile.fetch()" class="mt-3" variant="outline">
        Retry
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { createResource } from 'frappe-ui'
import { session } from '@/data/session'

// Form data
const form = ref({
  first_name: '',
  last_name: '',
  mobile_no: '',
  bio: '',
  location: '',
  website: ''
})

const originalForm = ref({})

// Get user profile
const userProfile = createResource({
  url: 'frappe.client.get',
  makeParams() {
    return {
      doctype: 'User',
      name: session.user
    }
  },
  auto: false,
  onSuccess(data) {
    // Populate form with user data
    const userData = {
      first_name: data.first_name || '',
      last_name: data.last_name || '',
      mobile_no: data.mobile_no || '',
      bio: data.bio || '',
      location: data.location || '',
      website: data.website || ''
    }
    form.value = { ...userData }
    originalForm.value = { ...userData }
  }
})

// Update profile
const updateProfile = createResource({
  url: 'frappe.client.set_value',
  makeParams() {
    return {
      doctype: 'User',
      name: session.user,
      fieldname: form.value
    }
  },
  onSuccess() {
    // Update original form data
    originalForm.value = { ...form.value }

    // Show success message
    alert('Profile updated successfully!')

    // Refresh user profile data
    userProfile.fetch()
  },
  onError(error) {
    alert('Failed to update profile: ' + error.message)
  }
})

const hasChanges = computed(() => {
  return Object.keys(form.value).some(
    key => form.value[key] !== originalForm.value[key]
  )
})

const getInitials = (name) => {
  return (
    name
      ?.split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U"
  )
}

const resetForm = () => {
  form.value = { ...originalForm.value }
}

const saveProfile = () => {
  if (!hasChanges.value) return
  updateProfile.submit()
}

// Load profile on mount
onMounted(() => {
  if (session.user) {
    userProfile.fetch()
  }
})

// Watch for session changes
watch(() => session.user, (newUser) => {
  if (newUser) {
    userProfile.fetch()
  }
})
</script>

<style scoped>
.update-profile {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}
</style>
