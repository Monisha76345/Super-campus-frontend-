import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { AppMessageModal, AppMessageType, LogoLoader } from '@/components/ui';
import { useAuthSession } from '@/features/auth/session/AuthSessionProvider';
import { useColors } from '@/theme/app-theme';
import { uploadMediaToServer } from '@/lib/api/media-upload';

import { CreateProjectWizard } from './components/projects/CreateProjectWizard';
import { ProjectCard } from './components/projects/ProjectCard';
import { ProjectDetailModal } from './components/projects/ProjectDetailModal';
import {
  createProjectApi,
  deleteProjectApi,
  fetchProjectsApi,
  updateProjectStatusApi,
} from './project-api';
import {
  CreateProjectPayload,
  Project,
  ProjectCategory,
  ProjectStatus,
} from './project-types';

type FilterTab = 'All' | 'Open' | 'Active' | 'Completed';

const DOMAIN_OPTIONS = [
  'All',
  'AI/ML',
  'Web Dev',
  'Mobile Apps',
  'Cloud & DevOps',
  'IoT & Embedded',
  'Cybersecurity',
  'Robotics',
  'Blockchain',
  'Data Science',
];

const CATEGORY_OPTIONS: (ProjectCategory | 'All')[] = [
  'All',
  'Academic',
  'Hackathon',
  'Startup',
  'Research',
  'Social impact',
  'Open source',
];

const SUPPORT_OFFERED_OPTIONS = ['All', 'Hire Students', 'Hire Mentor'];
const SUPPORT_REQUIRED_OPTIONS = ['All', 'College Funding', 'Crowdfunding'];

export function ProjectsScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const { user } = useAuthSession();
  const token = user?.token;
  const tenantId = user?.tenantId || 'nmit';

  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [myProjectsOnly, setMyProjectsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory | 'All'>('All');
  const [selectedSupportOffered, setSelectedSupportOffered] = useState('All');
  const [selectedSupportRequired, setSelectedSupportRequired] = useState('All');
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [showWizard, setShowWizard] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [modalConfig, setModalConfig] = useState<{
    visible: boolean;
    type: AppMessageType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showModal = (
    title: string,
    message: string,
    type: AppMessageType = 'info',
    onConfirm?: () => void,
  ) => {
    setModalConfig({ visible: true, title, message, type, onConfirm });
  };

  const loadProjects = useCallback(async () => {
    try {
      setLoading(true);

      const supportOfferedParam =
        selectedSupportOffered === 'Hire Students'
          ? 'HIRE_STUDENTS'
          : selectedSupportOffered === 'Hire Mentor'
            ? 'HIRE_MENTOR'
            : selectedSupportOffered === 'All'
              ? undefined
              : selectedSupportOffered;

      const supportRequiredParam =
        selectedSupportRequired === 'College Funding'
          ? 'COLLEGE_FUNDING'
          : selectedSupportRequired === 'Crowdfunding'
            ? 'CROWDFUNDING'
            : selectedSupportRequired === 'All'
              ? undefined
              : selectedSupportRequired;

      const fetched = await fetchProjectsApi(token, tenantId, {
        status: activeTab === 'All' ? undefined : (activeTab.toUpperCase() as ProjectStatus),
        mine: myProjectsOnly,
        search: searchQuery.trim() || undefined,
        domain: selectedDomain === 'All' ? undefined : selectedDomain,
        category: selectedCategory === 'All' ? undefined : selectedCategory,
        supportOffered: supportOfferedParam,
        supportRequired: supportRequiredParam,
      });

      setProjects(fetched || []);
    } catch {
      // Keep existing list on transient network error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [
    token,
    tenantId,
    activeTab,
    myProjectsOnly,
    searchQuery,
    selectedDomain,
    selectedCategory,
    selectedSupportOffered,
    selectedSupportRequired,
  ]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedDomain !== 'All') count++;
    if (selectedCategory !== 'All') count++;
    if (selectedSupportOffered !== 'All') count++;
    if (selectedSupportRequired !== 'All') count++;
    return count;
  }, [selectedDomain, selectedCategory, selectedSupportOffered, selectedSupportRequired]);

  const clearAllFilters = () => {
    setSelectedDomain('All');
    setSelectedCategory('All');
    setSelectedSupportOffered('All');
    setSelectedSupportRequired('All');
    setSearchQuery('');
  };

  const handleCreateProject = async (payload: CreateProjectPayload) => {
    try {
      let finalPayload: CreateProjectPayload = { ...payload };

      // Upload PDF to document-uploader if selected locally
      if (
        payload.pdfDocument?.uri &&
        payload.pdfDocument.uri.startsWith('file://') &&
        token &&
        tenantId
      ) {
        try {
          const remoteUrl = await uploadMediaToServer(
            payload.pdfDocument.uri,
            token,
            tenantId,
            'application/pdf',
            'project',
            'doc',
          );
          finalPayload.pdfDocument = {
            ...payload.pdfDocument,
            uri: remoteUrl,
          };
        } catch (uploadErr) {
          console.warn('[PDF Upload] Upload fallback:', uploadErr);
        }
      }

      let created: Project;
      if (token && tenantId) {
        created = await createProjectApi(token, tenantId, finalPayload);
      } else {
        throw new Error('Please sign in to publish a campus project.');
      }

      setProjects((current) => [created, ...current]);
      setShowWizard(false);
      setSelectedProject(created);
      showModal('Success', 'Your project has been published to campus!', 'success');
    } catch (err: any) {
      showModal('Error', err?.message || 'Could not create project', 'error');
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setShowWizard(true);
  };

  const handleUpdateProject = async (payload: CreateProjectPayload) => {
    try {
      if (!editingProject) return;

      const updatedProject: Project = {
        ...editingProject,
        title: payload.title,
        shortDescription: payload.shortDescription,
        moreDetails: payload.moreDetails,
        category: payload.category,
        stage: payload.stage,
        duration: payload.duration || editingProject.duration,
        visibility: payload.visibility || editingProject.visibility,
        skills: payload.skills || editingProject.skills,
        supportNeeds: payload.supportNeeds || editingProject.supportNeeds,
        pdfDocument: payload.pdfDocument !== undefined ? payload.pdfDocument : editingProject.pdfDocument,
        updatedAt: new Date().toISOString(),
      };

      setProjects((current) =>
        current.map((p) => (p.id === editingProject.id ? updatedProject : p)),
      );
      if (selectedProject?.id === editingProject.id) {
        setSelectedProject(updatedProject);
      }
      setShowWizard(false);
      setEditingProject(null);
      showModal('Success', 'Project updated successfully!', 'success');
    } catch (err: any) {
      showModal('Error', err?.message || 'Could not update project', 'error');
    }
  };

  const handleStatusChange = async (projectId: string, newStatus: ProjectStatus) => {
    try {
      if (token && tenantId) {
        await updateProjectStatusApi(token, tenantId, projectId, newStatus);
      }
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p)),
      );
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject({ ...selectedProject, status: newStatus });
      }
      showModal('Status Updated', `Project moved to ${newStatus}`, 'success');
    } catch (err: any) {
      showModal('Error', err?.message || 'Could not update status', 'error');
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      if (token && tenantId) {
        await deleteProjectApi(token, tenantId, projectId);
      }
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      setSelectedProject(null);
      showModal('Deleted', 'Project removed successfully', 'info');
    } catch (err: any) {
      showModal('Error', err?.message || 'Could not delete project', 'error');
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.topBarTitle}>Campus Projects</Text>
        </View>

        <View style={styles.topBarRight}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setMyProjectsOnly((prev) => !prev)}
            style={[styles.myProjectsBtn, myProjectsOnly && styles.myProjectsBtnActive]}
          >
            <Text
              style={[styles.myProjectsText, myProjectsOnly && styles.myProjectsTextActive]}
            >
              My Projects
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onRefresh}
            style={styles.refreshBtn}
            hitSlop={8}
          >
            <Ionicons name="refresh" size={20} color={Colors.text.secondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary.accent}
          />
        }
      >
        {/* Hero Card Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>Ideas become impact here</Text>
            <Text style={styles.heroSubtitle}>
              Build a team, find a mentor, and get campus funding & grants.
            </Text>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setEditingProject(null);
                setShowWizard(true);
              }}
              style={styles.createProjectBtn}
            >
              <Ionicons name="add" size={20} color={Colors.text.onBrand} />
              <Text style={styles.createProjectBtnText}>Create Project</Text>
            </Pressable>
          </View>

          {/* Decorative Rocket Icon */}
          <View style={styles.rocketIconWatermark}>
            <Ionicons name="rocket" size={90} color={Colors.border.subtle} />
          </View>
        </View>

        {/* Search Input with Filter Button */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color={Colors.text.tertiary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search projects by domain, title, tech stack..."
              placeholderTextColor={Colors.text.tertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={18} color={Colors.text.tertiary} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.filterTriggerBtn, activeFiltersCount > 0 && styles.filterTriggerBtnActive]}
            onPress={() => setShowFiltersModal(true)}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFiltersCount > 0 ? '#FFFFFF' : Colors.text.primary}
            />
            {activeFiltersCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.filterTabsRow}>
          {(['All', 'Open', 'Active', 'Completed'] as FilterTab[]).map((tab) => {
            const active = activeTab === tab;
            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                onPress={() => setActiveTab(tab)}
                style={[styles.tabPill, active && styles.tabPillActive]}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Quick Domain Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.domainChipsContainer}
        >
          {DOMAIN_OPTIONS.map((dom) => {
            const isSel = selectedDomain === dom;
            return (
              <Pressable
                key={dom}
                style={[styles.domainChip, isSel && styles.domainChipActive]}
                onPress={() => setSelectedDomain(dom)}
              >
                <Text style={[styles.domainChipText, isSel && styles.domainChipTextActive]}>
                  {dom}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Active Filters Summary Pill */}
        {activeFiltersCount > 0 && (
          <View style={styles.activeFiltersPillRow}>
            <Text style={styles.activeFiltersPillText}>
              Filters: {selectedCategory !== 'All' ? `${selectedCategory} • ` : ''}
              {selectedSupportOffered !== 'All' ? `${selectedSupportOffered} • ` : ''}
              {selectedSupportRequired !== 'All' ? `${selectedSupportRequired}` : ''}
            </Text>
            <Pressable onPress={clearAllFilters} hitSlop={6}>
              <Text style={styles.clearFiltersText}>Reset</Text>
            </Pressable>
          </View>
        )}

        {/* Projects List */}
        {loading && !refreshing ? (
          <LogoLoader size={48} text="Loading campus projects..." style={{ marginTop: 40 }} />
        ) : projects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No projects found</Text>
            <Text style={styles.emptySubtitle}>
              {myProjectsOnly
                ? "You haven't created any projects yet."
                : 'No projects match your active search and filter criteria.'}
            </Text>
            {activeFiltersCount > 0 ? (
              <Pressable onPress={clearAllFilters} style={styles.resetFiltersBtn}>
                <Text style={styles.resetFiltersBtnText}>Clear All Filters</Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => setShowWizard(true)}
                style={[styles.createProjectBtn, { marginTop: 14 }]}
              >
                <Ionicons name="add" size={18} color={Colors.text.onBrand} />
                <Text style={styles.createProjectBtnText}>Create first project</Text>
              </Pressable>
            )}
          </View>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={() => setSelectedProject(project)}
              onEdit={() => handleEditProject(project)}
            />
          ))
        )}
      </ScrollView>

      {/* FILTER DRAWER / MODAL */}
      <Modal visible={showFiltersModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search & Filter Projects</Text>
              <Pressable onPress={() => setShowFiltersModal(false)}>
                <Ionicons name="close" size={22} color={Colors.text.primary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {/* Category */}
              <Text style={styles.filterSectionTitle}>Category</Text>
              <View style={styles.filterOptionsGrid}>
                {CATEGORY_OPTIONS.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.filterOptionChip, selectedCategory === cat && styles.filterOptionChipActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.filterOptionText, selectedCategory === cat && styles.filterOptionTextActive]}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Support Offered */}
              <Text style={styles.filterSectionTitle}>Support Offered</Text>
              <View style={styles.filterOptionsGrid}>
                {SUPPORT_OFFERED_OPTIONS.map((supp) => (
                  <Pressable
                    key={supp}
                    style={[styles.filterOptionChip, selectedSupportOffered === supp && styles.filterOptionChipActive]}
                    onPress={() => setSelectedSupportOffered(supp)}
                  >
                    <Text style={[styles.filterOptionText, selectedSupportOffered === supp && styles.filterOptionTextActive]}>
                      {supp}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {/* Support Required */}
              <Text style={styles.filterSectionTitle}>Funding & Grants Required</Text>
              <View style={styles.filterOptionsGrid}>
                {SUPPORT_REQUIRED_OPTIONS.map((supp) => (
                  <Pressable
                    key={supp}
                    style={[styles.filterOptionChip, selectedSupportRequired === supp && styles.filterOptionChipActive]}
                    onPress={() => setSelectedSupportRequired(supp)}
                  >
                    <Text style={[styles.filterOptionText, selectedSupportRequired === supp && styles.filterOptionTextActive]}>
                      {supp}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooterRow}>
              <Pressable style={styles.modalResetBtn} onPress={clearAllFilters}>
                <Text style={styles.modalResetText}>Reset All</Text>
              </Pressable>
              <Pressable
                style={styles.modalApplyBtn}
                onPress={() => setShowFiltersModal(false)}
              >
                <Text style={styles.modalApplyText}>Apply Filters</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3-Step Create / Edit Project Wizard Modal */}
      <Modal visible={showWizard} animationType="slide" presentationStyle="pageSheet">
        <CreateProjectWizard
          initialProject={editingProject}
          onClose={() => {
            setShowWizard(false);
            setEditingProject(null);
          }}
          onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
        />
      </Modal>

      {/* Project Detail & Status Switcher Modal */}
      <ProjectDetailModal
        project={selectedProject}
        visible={!!selectedProject}
        currentUserId={user?.id}
        isAdmin={user?.role === 'admin'}
        onClose={() => setSelectedProject(null)}
        onEdit={handleEditProject}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteProject}
        onProjectUpdated={(up) => {
          setSelectedProject(up);
          setProjects((curr) => curr.map((p) => (p.id === up.id ? up : p)));
        }}
      />

      {/* Unified App Message Modal */}
      <AppMessageModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => {
          setModalConfig((prev) => ({ ...prev, visible: false }));
          modalConfig.onConfirm?.();
        }}
      />
    </View>
  );
}

function createStyles(Colors: ColorTokens) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background.canvas,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 48,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border.subtle,
      backgroundColor: Colors.background.canvas,
    },
    topBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    topBarTitle: {
      fontFamily: Typography.bold,
      fontSize: 20,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    topBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    myProjectsBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border.card,
      backgroundColor: Colors.background.surface,
    },
    myProjectsBtnActive: {
      backgroundColor: Colors.primary.accent + '20',
      borderColor: Colors.primary.accent,
    },
    myProjectsText: {
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: Colors.text.secondary,
    },
    myProjectsTextActive: {
      fontFamily: Typography.bold,
      color: Colors.primary.accent,
      fontWeight: '700',
    },
    refreshBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.background.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    heroCard: {
      backgroundColor: Colors.background.surface,
      borderRadius: 18,
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: Colors.border.card,
      marginBottom: 14,
    },
    heroContent: {
      zIndex: 2,
    },
    heroTitle: {
      fontFamily: Typography.bold,
      fontSize: 20,
      fontWeight: '800',
      color: Colors.text.primary,
      marginBottom: 4,
    },
    heroSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      marginBottom: 16,
      maxWidth: '85%',
    },
    createProjectBtn: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Colors.primary.accent,
      borderRadius: 22,
      paddingHorizontal: 18,
      paddingVertical: 10,
    },
    createProjectBtnText: {
      fontFamily: Typography.bold,
      fontSize: 14,
      fontWeight: '700',
      color: Colors.text.onBrand,
    },
    rocketIconWatermark: {
      position: 'absolute',
      right: 12,
      top: 18,
      zIndex: 1,
      opacity: 0.25,
    },
    // Search row
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 10,
    },
    searchInputWrapper: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
    },
    searchInput: {
      flex: 1,
      fontFamily: Typography.medium,
      fontSize: 13.5,
      color: Colors.text.primary,
      paddingVertical: 0,
    },
    filterTriggerBtn: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    },
    filterTriggerBtnActive: {
      backgroundColor: Colors.primary.accent,
      borderColor: Colors.primary.accent,
    },
    filterBadge: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 14,
      height: 14,
      borderRadius: 7,
      backgroundColor: '#EF4444',
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterBadgeText: {
      fontSize: 9,
      color: '#FFFFFF',
      fontWeight: '800',
    },
    filterTabsRow: {
      flexDirection: 'row',
      gap: 8,
      marginBottom: 10,
    },
    tabPill: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 18,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    tabPillActive: {
      backgroundColor: Colors.primary.accent,
      borderColor: Colors.primary.accent,
    },
    tabText: {
      fontFamily: Typography.medium,
      fontSize: 12.5,
      color: Colors.text.secondary,
    },
    tabTextActive: {
      fontFamily: Typography.bold,
      color: Colors.text.onBrand,
      fontWeight: '700',
    },
    // Domain chips
    domainChipsContainer: {
      gap: 8,
      paddingBottom: 10,
    },
    domainChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    domainChipActive: {
      borderColor: '#3B82F6',
      backgroundColor: '#3B82F620',
    },
    domainChipText: {
      fontFamily: Typography.medium,
      fontSize: 11.5,
      color: Colors.text.secondary,
    },
    domainChipTextActive: {
      fontFamily: Typography.bold,
      color: '#3B82F6',
      fontWeight: '700',
    },
    activeFiltersPillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.background.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 7,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    activeFiltersPillText: {
      fontFamily: Typography.medium,
      fontSize: 11.5,
      color: Colors.primary.accent,
      flex: 1,
    },
    clearFiltersText: {
      fontFamily: Typography.bold,
      fontSize: 12,
      color: '#EF4444',
      marginLeft: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 48,
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 16,
      fontWeight: '700',
      color: Colors.text.primary,
      marginTop: 12,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontFamily: Typography.regular,
      fontSize: 13,
      color: Colors.text.secondary,
      textAlign: 'center',
      paddingHorizontal: 20,
    },
    resetFiltersBtn: {
      marginTop: 14,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 18,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    resetFiltersBtnText: {
      fontFamily: Typography.bold,
      fontSize: 12.5,
      color: Colors.primary.accent,
    },
    // Filter Modal Sheet
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      justifyContent: 'flex-end',
    },
    modalSheet: {
      backgroundColor: Colors.background.canvas,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 20,
      paddingBottom: 34,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    modalTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '800',
      color: Colors.text.primary,
    },
    filterSectionTitle: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: Colors.text.secondary,
      marginTop: 12,
      marginBottom: 8,
    },
    filterOptionsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    filterOptionChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    filterOptionChipActive: {
      backgroundColor: Colors.primary.accent,
      borderColor: Colors.primary.accent,
    },
    filterOptionText: {
      fontFamily: Typography.medium,
      fontSize: 12,
      color: Colors.text.secondary,
    },
    filterOptionTextActive: {
      fontFamily: Typography.bold,
      color: '#FFFFFF',
      fontWeight: '700',
    },
    modalFooterRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 20,
    },
    modalResetBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    modalResetText: {
      fontFamily: Typography.bold,
      fontSize: 13,
      color: Colors.text.secondary,
    },
    modalApplyBtn: {
      flex: 2,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      borderRadius: 12,
      backgroundColor: Colors.primary.accent,
    },
    modalApplyText: {
      fontFamily: Typography.bold,
      fontSize: 13.5,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });
}
