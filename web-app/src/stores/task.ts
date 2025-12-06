import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '../utils/api'
import {useAuthStore} from './auth'
import { type Board, type Task, type CreateBoardRequest, type CreateTaskRequest, type Sprint, type CreateSprintRequest, type SprintStats } from '../../types/src'

export const useTaskStore = defineStore('task', () => {
    const authStore = useAuthStore()
    const currentUserId = computed(() => authStore.user?.id || '')

    const boards = ref<Board[]>([])
    const currentBoard = ref<Board | null>(null)
    const boardId = computed(() => currentBoard.value?.id || '')

    const tasks = ref<Task[]>([])

    const sprints = ref<Sprint[]>([])
    const activeSprint = ref<Sprint | null>(null)
    const sprintStats = ref<SprintStats | null>(null)

    // Board methods
    async function fetchBoards() {
      try {
        const response = await api.get<Board[]>('/boards')
        const tempCurrentUserId = authStore.user?.id
        if(!tempCurrentUserId){
          throw ('NotFoundException')
        }
        boards.value = response.data.filter(board =>
          board.ownerId === authStore.user?.id || board.members?.includes(tempCurrentUserId)
        )
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function fetchBoardsTasksCounter() {
      let TaskCounter = 0;
      try{
        for (const board of boards.value) {
          const boardId = board.id;
          const tempTasks = await fetchBoardTasks(boardId);
          const activeTasksCount = tempTasks.filter((task: Task) => 
          task.status !== 'done' && task.status !== 'backlog'
          ).length;
          TaskCounter += activeTasksCount;
        }
        return TaskCounter;
      } catch (error){
        console.log('error: ' + error)
        TaskCounter = 0
        return TaskCounter
      }
      
    }

    async function createBoard(boardData: CreateBoardRequest) {
      try {
        const response = await api.post<Board>('/boards', boardData)
        boards.value.push(response.data)
        return response.data
      } catch (error) {
        throw error
      }
    }

    // Task methods
    async function fetchBoardTasks(boardIdParam: string, sprintId?: string) {
      try {
        const params = sprintId ? { sprintId } : {}
        const response = await api.get<Task[]>(`/boards/${boardIdParam}/tasks`, { params })
        tasks.value = response.data
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function createTask(boardIdParam: string, taskData: CreateTaskRequest) {
      try {
        const response = await api.post<Task>(`/boards/${boardIdParam}/tasks`, taskData)
        tasks.value.push(response.data)
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function updateTask(taskId: string, updates: Partial<Task>) {
      try {
        const response = await api.put<Task>(`/tasks/${taskId}`, updates)
        const index = tasks.value.findIndex(t => t.id === taskId)
        if (index !== -1) {
          tasks.value[index] = response.data
        }
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function deleteTask(taskId: string) {
      try {
        await api.delete(`/tasks/${taskId}`)
        const index = tasks.value.findIndex(t => t.id === taskId)
        if (index !== -1) {
          tasks.value.splice(index, 1)
        }
      } catch (error) {
        throw error
      }
    }

    // Sprint methods
    async function fetchSprints(boardIdParam: string) {
      try {
        const response = await api.get<Sprint[]>(`/boards/${boardIdParam}/sprints`)
        sprints.value = response.data
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function fetchActiveSprint(boardIdParam: string) {
      try {
        const response = await api.get<Sprint>(`/boards/${boardIdParam}/active-sprint`)
        activeSprint.value = response.data
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function createSprint(sprintData: CreateSprintRequest) {
      if (sprintData.startDate === undefined || sprintData.endDate === undefined){
        throw new Error('Дата не определена')
      }
      const start = new Date(sprintData.startDate)
      const end = new Date(sprintData.endDate)
      
      if (end <= start) {
        throw new Error('Дата окончания должна быть после даты начала')
      }

      if (start < new Date()) {
        throw new Error('Дата начала не может быть в прошлом')
      }

      try {
        const response = await api.post<Sprint>('/sprints', sprintData)
        sprints.value.push(response.data)
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function updateSprintStatus(sprintId: string, status: string) {
      try {
        const response = await api.put<Sprint>(`/sprints/${sprintId}/status`, { status })
        const index = sprints.value.findIndex(s => s.id === sprintId)
        if (index !== -1) {
          sprints.value[index] = response.data
        }
        if (activeSprint.value?.id === sprintId) {
          activeSprint.value = response.data
        }
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function fetchSprintStats(sprintId: string) {
      try {
        const response = await api.get<SprintStats>(`/sprints/${sprintId}/stats`)
        sprintStats.value = response.data
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function addTasksToSprint(sprintId: string, taskIds: string[]) {
      try {
        await api.put(`/sprints/${sprintId}/tasks`, { taskIds })
        // Обновляем задачи в локальном состоянии
        tasks.value.forEach(task => {
          if (taskIds.includes(task.id)) {
            task.sprintId = sprintId
          }
        })
      } catch (error) {
        throw error
      }
    }

    async function deleteSprint(sprintId: string) {
      try {
        await api.delete(`/sprints/${sprintId}`)
        const index = sprints.value.findIndex(s => s.id === sprintId)
        if (index !== -1) {
          sprints.value.splice(index, 1)
        }
        if (activeSprint.value?.id === sprintId) {
          activeSprint.value = null
        }
      } catch (error) {
        throw error
      }
    }

    async function updateSprintTeam(sprintId: string, teamData: { scrumMasterId: string; teamMembers: string[] }): Promise<Sprint> {
      try {
        const response = await api.put<Sprint>(`/sprints/${sprintId}/team`, teamData)
        const index = sprints.value.findIndex(s => s.id === sprintId)
        if (index !== -1) {
          sprints.value[index] = response.data
        }
        if (activeSprint.value?.id === sprintId) {
          activeSprint.value = response.data
        }
        return response.data
      } catch (error) {
        throw error
      }
    }

    async function completeSprint(sprintId: string, boardIdParam: string) {
    try {
      await api.post(`/api/boards/${boardIdParam}/sprints/${sprintId}/complete`);
      await fetchBoardTasks(boardIdParam);
    } catch (error) {
        console.error('Failed to complete sprint:', error);
        throw error;
      }
    }

    // Computed для assigned tasks пользователя
    const assignedTasks = computed(() => {
      const userId = currentUserId.value
      if (!userId) return []
      return tasks.value.filter(task => 
        task.assigneeId === currentUserId.value &&  
        task.boardId === boardId.value  
      );
    });

    return {
      boards,
      currentBoard,
      tasks,
      sprints,
      activeSprint,
      sprintStats,
      fetchBoards,
      createBoard,
      fetchBoardTasks,
      createTask,
      updateTask,
      deleteTask,
      fetchSprints,
      fetchActiveSprint,
      createSprint,
      updateSprintStatus,
      fetchSprintStats,
      addTasksToSprint,
      deleteSprint,
      updateSprintTeam,
      completeSprint,
      assignedTasks,
      fetchBoardsTasksCounter,
    }
  })