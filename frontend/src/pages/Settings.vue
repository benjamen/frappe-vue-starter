<template>
  <div
    class="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-4"
  >
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1
            class="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
          >
            Settings
          </h1>
          <p class="text-gray-600 mt-1">Manage your account and preferences</p>
        </div>
        <Button
          v-if="hasChanges"
          variant="solid"
          :loading="saving"
          @click="saveAll"
          class="!bg-gradient-to-r !from-green-600 !to-emerald-600 !text-white hover:!from-green-700 hover:!to-emerald-700 !shadow-lg hover:!shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          Save Changes
        </Button>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center py-16">
        <LoadingText>Loading your settings...</LoadingText>
      </div>

      <!-- Error State -->
      <ErrorMessage v-else-if="error" :message="error">
        <Button @click="reload" variant="outline" size="sm"> Retry </Button>
      </ErrorMessage>

      <!-- Settings Content -->
      <div v-else-if="userDoc" class="space-y-6">
        <!-- Profile Card (Read-Only) -->
        <Card
          title="Profile Information"
          subtitle="Your account details (managed via profile settings)"
          class="!bg-white/70 !backdrop-blur-sm !shadow-xl !border-white/20 hover:!shadow-2xl !transition-all !duration-300"
        >
          <template #actions>
            <div class="flex items-center gap-3">
              <router-link
                to="/profile"
                class="text-sm text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
              >
                <FeatherIcon name="edit-2" class="w-4 h-4" />
                Edit Profile
              </router-link>
              <div
                class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center"
              >
                <FeatherIcon name="user" class="w-5 h-5 text-white" />
              </div>
            </div>
          </template>

          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700"
                >Full Name</label
              >
              <div
                class="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
              >
                {{ userDoc.full_name || "Not set" }}
              </div>
            </div>
            <div class="space-y-2">
              <label class="block text-sm font-medium text-gray-700"
                >Email Address</label
              >
              <div
                class="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
              >
                {{ userDoc.email || "Not set" }}
              </div>
            </div>
          </div>
        </Card>

        <!-- Preferences Card -->
        <Card
          title="Preferences"
          subtitle="Customize your experience"
          class="!bg-white/70 !backdrop-blur-sm !shadow-xl !border-white/20 hover:!shadow-2xl !transition-all !duration-300"
        >
          <template #actions>
            <div
              class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center"
            >
              <FeatherIcon name="sliders" class="w-5 h-5 text-white" />
            </div>
          </template>

          <div class="space-y-6">
            <div
              class="p-4 bg-white/30 rounded-xl border border-white/30 hover:bg-white/50 transition-all duration-200"
            >
              <FormControl
                type="checkbox"
                label="Enable Notifications"
                description="Receive updates and alerts"
                v-model="localPreferences.enable_notifications"
                @change="markDirty"
              />
            </div>

            <div
              class="p-4 bg-white/30 rounded-xl border border-white/30 hover:bg-white/50 transition-all duration-200"
            >
              <FormControl
                type="checkbox"
                label="Dark Mode"
                description="Switch to dark theme"
                v-model="localPreferences.dark_mode"
                @change="handleDarkModeChange"
              />
            </div>

            <div
              class="p-4 bg-white/30 rounded-xl border border-white/30 hover:bg-white/50 transition-all duration-200"
            >
              <FormControl
                type="checkbox"
                label="Email Notifications"
                description="Receive notifications via email"
                v-model="localPreferences.email_notifications"
                @change="markDirty"
              />
            </div>

            <div
              class="p-4 bg-white/30 rounded-xl border border-white/30 hover:bg-white/50 transition-all duration-200"
            >
              <div class="space-y-3">
                <label class="block text-sm font-medium text-gray-700"
                  >Language</label
                >
                <select
                  v-model="localPreferences.language"
                  @change="markDirty"
                  class="w-full px-4 py-2 bg-white/50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        <!-- Security Card -->
        <Card
          title="Security"
          subtitle="Manage your account security"
          class="!bg-white/70 !backdrop-blur-sm !shadow-xl !border-white/20 hover:!shadow-2xl !transition-all !duration-300"
        >
          <template #actions>
            <div
              class="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center"
            >
              <FeatherIcon name="lock" class="w-5 h-5 text-white" />
            </div>
          </template>

          <div class="space-y-4">
            <div
              class="p-4 bg-white/30 rounded-xl border border-white/30 hover:bg-white/50 transition-all duration-200"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-800">Password</p>
                  <p class="text-sm text-gray-600">
                    Update your account password
                  </p>
                </div>
                <Button
                  variant="outline"
                  @click="showChangePassword = true"
                  class="!border-2 !border-gray-200 hover:!border-indigo-300 hover:!text-indigo-600 transform hover:scale-105 transition-all duration-200"
                >
                  Change Password
                </Button>
              </div>
            </div>

            <div
              class="p-4 bg-white/30 rounded-xl border border-white/30 hover:bg-white/50 transition-all duration-200"
            >
              <FormControl
                type="checkbox"
                label="Two-Factor Authentication"
                description="Add an extra layer of security to your account"
                v-model="localPreferences.two_factor_enabled"
                @change="markDirty"
              />
            </div>
          </div>
        </Card>

        <!-- Changes Indicator -->
        <Alert
          v-if="hasChanges"
          title="Unsaved Changes"
          class="!bg-orange-50/80 !backdrop-blur-sm !border-orange-200 !shadow-lg"
        >
          <template #actions>
            <Button
              variant="ghost"
              size="sm"
              @click="saveAll"
              :loading="saving"
              class="!text-orange-700 hover:!bg-orange-100"
            >
              Save Now
            </Button>
          </template>
          You have unsaved changes that need to be saved.
        </Alert>
      </div>

      <!-- Change Password Dialog -->
      <Dialog
        v-model="showChangePassword"
        :options="{
          title: 'Change Password',
          description: 'Update your account password',
          size: 'sm',
        }"
      >
        <template #body>
          <div class="space-y-4">
            <FormControl
              label="Current Password"
              type="password"
              v-model="passwordForm.currentPassword"
              required
              :error="passwordForm.errors.currentPassword"
            />
            <FormControl
              label="New Password"
              type="password"
              v-model="passwordForm.newPassword"
              required
              :error="passwordForm.errors.newPassword"
            />
            <FormControl
              label="Confirm New Password"
              type="password"
              v-model="passwordForm.confirmPassword"
              required
              :error="passwordForm.errors.confirmPassword"
            />
            <div class="flex gap-2 justify-end pt-4">
              <Button variant="outline" @click="showChangePassword = false">
                Cancel
              </Button>
              <Button
                variant="solid"
                :loading="passwordForm.loading"
                @click="changePassword"
                class="!bg-blue-600 !text-white hover:!bg-blue-700"
              >
                Change Password
              </Button>
            </div>
          </div>
        </template>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated } from "vue";
import { session } from "@/data/session";
import { createDocumentResource } from "frappe-ui";
import {
  Button,
  Card,
  FormControl,
  LoadingText,
  ErrorMessage,
  Alert,
  FeatherIcon,
  Dialog,
} from "frappe-ui";

// State
const showChangePassword = ref(false);
const dirty = ref(false);
const saving = ref(false);
const loading = ref(true);
const error = ref(null);
const userDoc = ref(null);

// Track when we've completed initial load
const initialLoadCompleted = ref(false);

// Local preferences
const localPreferences = ref({
  enable_notifications: false,
  dark_mode: document.documentElement.classList.contains("dark"),
  email_notifications: true,
  language: "en",
  two_factor_enabled: false,
});

// Password form
const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  loading: false,
  errors: {},
});

// Initialize user resource
const userResource = createDocumentResource({
  doctype: "User",
  name: session.user,
  auto: false, // We'll control loading manually
});

// Computed
const hasChanges = computed(() => dirty.value);

// Load data function (fixed for navigation/keep-alive)
async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const data = await userResource.reload(); // or .fetch() if needed
    userDoc.value = data;
    loading.value = false;
    initialLoadCompleted.value = true;
  } catch (err) {
    error.value = "Failed to load settings. Please try again.";
    loading.value = false;
  }
}

// Dark mode
function applyDarkMode(enabled) {
  document.documentElement.classList.toggle("dark", enabled);
}

function handleDarkModeChange() {
  markDirty();
  applyDarkMode(localPreferences.value.dark_mode);
}

function markDirty() {
  dirty.value = true;
}

// Save preferences only (not profile info)
async function saveAll() {
  if (!userDoc.value) return;

  saving.value = true;
  try {
    // Save preferences to user settings or a separate doctype
    // This would typically be a call to save user preferences
    console.log("Saving preferences:", localPreferences.value);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    dirty.value = false;

    // Show success message
    const successDiv = document.createElement("div");
    successDiv.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
    successDiv.textContent = "Settings saved successfully!";
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  } catch (err) {
    error.value = "Failed to save changes. Please try again.";
  } finally {
    saving.value = false;
  }
}

// Reload
function reload() {
  error.value = null;
  loading.value = true;
  loadData();
}

// Password change
function validatePasswordForm() {
  passwordForm.value.errors = {};

  if (!passwordForm.value.currentPassword) {
    passwordForm.value.errors.currentPassword = "Current password is required";
  }

  if (!passwordForm.value.newPassword) {
    passwordForm.value.errors.newPassword = "New password is required";
  } else if (passwordForm.value.newPassword.length < 6) {
    passwordForm.value.errors.newPassword =
      "Password must be at least 6 characters";
  }

  if (!passwordForm.value.confirmPassword) {
    passwordForm.value.errors.confirmPassword = "Please confirm your password";
  } else if (
    passwordForm.value.newPassword !== passwordForm.value.confirmPassword
  ) {
    passwordForm.value.errors.confirmPassword = "Passwords do not match";
  }

  return Object.keys(passwordForm.value.errors).length === 0;
}

async function changePassword() {
  if (!validatePasswordForm()) return;

  passwordForm.value.loading = true;
  try {
    // In a real app, call your API here
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Show success message
    const successDiv = document.createElement("div");
    successDiv.className =
      "fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50";
    successDiv.textContent = "Password changed successfully!";
    document.body.appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);

    // Reset form
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      loading: false,
      errors: {},
    };
    showChangePassword.value = false;
  } catch (err) {
    passwordForm.value.errors.general =
      "Failed to change password. Please try again.";
  } finally {
    passwordForm.value.loading = false;
  }
}

// Lifecycle hooks
onMounted(() => {
  // Load data on initial mount
  loadData();
});

onActivated(() => {
  // Refresh data when navigating back to this page
  if (initialLoadCompleted.value) {
    loadData();
  }
});
</script>
