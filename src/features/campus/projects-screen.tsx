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
  View,
} from 'react-native';

import { ColorTokens } from '@/constants/colors';
import { Typography } from '@/constants/fonts';
import { AppMessageModal, AppMessageType, LogoLoader } from '@/components/ui';
import { useAuthSession } from '@/features/auth/session/AuthSessionProvider';
import { useColors } from '@/theme/app-theme';

import { CreateProjectWizard } from './components/projects/CreateProjectWizard';
import { ProjectCard } from './components/projects/ProjectCard';
import { ProjectDetailModal } from './components/projects/ProjectDetailModal';
import {
  createProjectApi,
  deleteProjectApi,
  fetchProjectsApi,
  updateProjectStatusApi,
} from './project-api';
import { CreateProjectPayload, Project, ProjectStatus } from './project-types';

type FilterTab = 'All' | 'Open' | 'Active' | 'Completed';

const FALLBACK_STARTER_PROJECTS: Project[] = [
  {
    id: 'starter-1',
    campusId: 'nmit',
    creatorId: 'mock-user-1',
    creatorName: 'Aarav Patel',
    title: 'test',
    shortDescription: 'test',
    category: 'Academic',
    stage: 'Idea',
    status: 'OPEN',
    duration: '3 – 6 Months',
    location: 'NMIT North Campus',
    visibility: 'CAMPUS_ONLY',
    skills: ['React Native', 'Node.js'],
    supportNeeds: [
      {
        serviceType: 'HIRE_STUDENTS',
        rolesNeeded: 'Frontend Developer',
        numberOfStudents: '2-4',
        commitment: 'Part-time',
      },
    ],
    media: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'starter-2',
    campusId: 'nmit',
    creatorId: 'mock-user-2',
    creatorName: 'Rohan Sharma',
    title: 'Cloud',
    shortDescription: 'Cloud disaster management',
    category: 'Startup',
    stage: 'Idea',
    status: 'OPEN',
    duration: '3 – 6 Months',
    location: 'NMIT North Campus',
    visibility: 'CAMPUS_ONLY',
    skills: ['AWS', 'Docker', 'Kubernetes'],
    supportNeeds: [
      {
        serviceType: 'COLLEGE_FUNDING',
        fundingDetails: 'Cloud compute credits',
      },
    ],
    media: [],
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'starter-3',
    campusId: 'nmit',
    creatorId: 'mock-user-3',
    creatorName: 'Sneha Rao',
    title: 'test push',
    shortDescription: 'notifications',
    category: 'Hackathon',
    stage: 'Prototype',
    status: 'OPEN',
    duration: '1 – 3 Months',
    location: 'NMIT North Campus',
    visibility: 'CAMPUS_ONLY',
    skills: ['Firebase', 'TypeScript'],
    supportNeeds: [],
    media: [],
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
  },
];

export function ProjectsScreen() {
  const router = useRouter();
  const Colors = useColors();
  const styles = useMemo(() => createStyles(Colors), [Colors]);

  const { user } = useAuthSession();
  const token = user?.token;
  const tenantId = user?.tenantId;

  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const [myProjectsOnly, setMyProjectsOnly] = useState(false);
  const [projects, setProjects] = useState<Project[]>(FALLBACK_STARTER_PROJECTS);
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
      const fetched = await fetchProjectsApi(token, tenantId, {
        status: activeTab === 'All' ? undefined : (activeTab.toUpperCase() as ProjectStatus),
        mine: myProjectsOnly,
      });
      if (fetched && fetched.length > 0) {
        setProjects(fetched);
      } else {
        // If API returned empty array, use local list if offline or show empty
        setProjects(fetched || []);
      }
    } catch {
      // Offline fallback: filter from local projects
      // Keeps app smooth if backend is offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, tenantId, activeTab, myProjectsOnly]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProjects();
  };

  // Filter local projects if working offline
  const visibleProjects = useMemo(() => {
    return projects.filter((p) => {
      if (myProjectsOnly && user?.id && p.creatorId !== user.id) {
        return false;
      }
      if (activeTab === 'All') return true;
      return p.status === activeTab.toUpperCase();
    });
  }, [projects, activeTab, myProjectsOnly, user?.id]);

  const handleCreateProject = async (payload: CreateProjectPayload) => {
    try {
      let created: Project;
      if (token && tenantId) {
        created = await createProjectApi(token, tenantId, payload);
      } else {
        // Local simulation fallback
        created = {
          id: `local-${Date.now()}`,
          campusId: 'nmit',
          creatorId: user?.id || 'current-user',
          creatorName: user?.fullName || 'Me',
          title: payload.title,
          shortDescription: payload.shortDescription,
          moreDetails: payload.moreDetails,
          category: payload.category,
          stage: payload.stage,
          status: 'OPEN',
          duration: payload.duration || '3 – 6 Months',
          location: payload.location || 'NMIT North Campus',
          visibility: payload.visibility || 'CAMPUS_ONLY',
          skills: payload.skills || [],
          supportNeeds: payload.supportNeeds || [],
          media: [],
          pdfDocument: payload.pdfDocument || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      setProjects((current) => [created, ...current]);
      setShowWizard(false);
      setSelectedProject(created);
      showModal('Success', 'Your project has been published!', 'success');
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
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#F8FAFC" />
          </Pressable>
          <Text style={styles.topBarTitle}>Projects</Text>
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
              My projects
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={onRefresh}
            style={styles.refreshBtn}
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
              Build a team, find a mentor, and get campus support.
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
              <Text style={styles.createProjectBtnText}>Create project</Text>
            </Pressable>
          </View>

          {/* Decorative Rocket Icon */}
          <View style={styles.rocketIconWatermark}>
            <Ionicons name="rocket" size={90} color={Colors.border.subtle} />
          </View>
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

        {/* Projects List */}
        {loading && !refreshing ? (
          <LogoLoader size={48} text="Loading campus projects..." style={{ marginTop: 40 }} />
        ) : visibleProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={Colors.text.tertiary} />
            <Text style={styles.emptyTitle}>No projects found</Text>
            <Text style={styles.emptySubtitle}>
              {myProjectsOnly
                ? "You haven't created any projects yet."
                : `There are currently no ${activeTab.toLowerCase()} projects.`}
            </Text>
            <Pressable
              onPress={() => setShowWizard(true)}
              style={[styles.createProjectBtn, { marginTop: 14 }]}
            >
              <Ionicons name="add" size={18} color={Colors.text.onBrand} />
              <Text style={styles.createProjectBtnText}>Create first project</Text>
            </Pressable>
          </View>
        ) : (
          visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onPress={() => setSelectedProject(project)}
              onEdit={() => handleEditProject(project)}
            />
          ))
        )}
      </ScrollView>

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
      />

      {/* Unified App Message Modal */}
      <AppMessageModal
        visible={modalConfig.visible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => {
          modalConfig.onConfirm?.();
          setModalConfig((prev) => ({ ...prev, visible: false }));
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
      paddingHorizontal: 18,
      paddingTop: 16,
      paddingBottom: 12,
    },
    topBarLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
    },
    topBarTitle: {
      fontFamily: Typography.bold,
      fontSize: 24,
      fontWeight: '700',
      color: Colors.text.primary,
    },
    topBarRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    myProjectsBtn: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: 'transparent',
    },
    myProjectsBtnActive: {
      backgroundColor: Colors.primary.glow,
    },
    myProjectsText: {
      fontFamily: Typography.medium,
      fontSize: 14,
      fontWeight: '600',
      color: Colors.text.secondary,
    },
    myProjectsTextActive: {
      color: Colors.primary.accent,
      fontWeight: '700',
    },
    refreshBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.background.surface,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: Colors.border.subtle,
    },
    scrollContent: {
      paddingHorizontal: 18,
      paddingBottom: 40,
    },
    heroCard: {
      position: 'relative',
      borderRadius: 24,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
      overflow: 'hidden',
      marginBottom: 20,
      marginTop: 4,
    },
    heroContent: {
      padding: 22,
      zIndex: 2,
    },
    heroTitle: {
      fontFamily: Typography.bold,
      fontSize: 22,
      fontWeight: '700',
      color: Colors.text.primary,
      marginBottom: 8,
    },
    heroSubtitle: {
      fontFamily: Typography.regular,
      fontSize: 14,
      lineHeight: 20,
      color: Colors.text.secondary,
      marginBottom: 18,
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
    },
    filterTabsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 18,
    },
    tabPill: {
      paddingHorizontal: 18,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: Colors.background.surface,
      borderWidth: 1,
      borderColor: Colors.border.card,
    },
    tabPillActive: {
      backgroundColor: Colors.primary.main,
      borderColor: Colors.primary.light,
    },
    tabText: {
      fontFamily: Typography.medium,
      fontSize: 13,
      fontWeight: '500',
      color: Colors.text.secondary,
    },
    tabTextActive: {
      color: Colors.text.onBrand,
      fontWeight: '700',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 50,
    },
    emptyTitle: {
      fontFamily: Typography.bold,
      fontSize: 18,
      fontWeight: '700',
      color: Colors.text.primary,
      marginTop: 12,
      marginBottom: 6,
    },
    emptySubtitle: {
      fontFamily: Typography.regular,
      fontSize: 14,
      color: Colors.text.tertiary,
      textAlign: 'center',
      maxWidth: 280,
    },
  });
}
