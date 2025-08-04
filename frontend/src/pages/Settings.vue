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
          Save All Changes
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
        <!-- Profile Card -->
        <Card
          title="Profile Information"
          subtitle="Update your personal details"
          class="!bg-white/70 !backdrop-blur-sm !shadow-xl !border-white/20 hover:!shadow-2xl !transition-all !duration-300"
        >
          <template #actions>
            <div
              class="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center"
            >
              <FeatherIcon name="user" class="w-5 h-5 text-white" />
            </div>
          </template>

          <div class="grid md:grid-cols-2 gap-6">
            <FormControl
              label="Full Name"
              v-model="userDoc.full_name"
              @change="markDirty"
              required
              class="[&_input]:!bg-white/50 [&_input]:!backdrop-blur-sm [&_input]:!border-2 [&_input]:!border-gray-200 [&_input]:!rounded-xl [&_input]:hover:!border-indigo-300 [&_input]:focus:!border-indigo-500 [&_input]:focus:!ring-4 [&_input]:focus:!ring-indigo-100"
            />
            <FormControl
              label="Email Address"
              type="email"
              v-model="userDoc.email"
              @change="markDirty"
              required
              class="[&_input]:!bg-white/50 [&_input]:!backdrop-blur-sm [&_input]:!border-2 [&_input]:!border-gray-200 [&_input]:!rounded-xl [&_input]:hover:!border-indigo-300 [&_input]:focus:!border-indigo-500 [&_input]:focus:!ring-4 [&_input]:focus:!ring-indigo-100"
            />
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

// Save
async function saveAll() {
  if (!userDoc.value) return;

  saving.value = true;
  try {
    await userResource.setValue.submit({
      full_name: userDoc.value.full_name,
      email: userDoc.value.email,
    });
    dirty.value = false;
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
