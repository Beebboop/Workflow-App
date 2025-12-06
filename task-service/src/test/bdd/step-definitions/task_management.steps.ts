/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import { loadFeature, defineFeature } from 'jest-cucumber';
import { BddTestingModule } from '../setup/bdd-testing.module';
import { TaskPriority, TaskStatus } from '../../../../types/src';
import { performance } from 'perf_hooks';

const feature = loadFeature('./src/test/bdd/features/task_management.feature');

// Интерфейс для задачи
interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  reporterId: string;
  assigneeId: string;
  createdAt: Date;
}

// Алгоритмы сортировки
class SortingAlgorithms {
  static quickSort(tasks: Task[]): Task[] {
    if (tasks.length <= 1) return tasks;
    
    const pivot = tasks[Math.floor(tasks.length / 2)];
    const left: Task[] = [];
    const right: Task[] = [];
    const equal: Task[] = [];
    
    const priorityOrder = { 
      [TaskPriority.URGENT]: 0, 
      [TaskPriority.HIGH]: 1, 
      [TaskPriority.MEDIUM]: 2, 
      [TaskPriority.LOW]: 3 
    };
    
    for (const task of tasks) {
      const cmp = priorityOrder[task.priority] - priorityOrder[pivot.priority];
      if (cmp < 0) left.push(task);
      else if (cmp > 0) right.push(task);
      else equal.push(task);
    }
    
    return [
      ...SortingAlgorithms.quickSort(left),
      ...equal,
      ...SortingAlgorithms.quickSort(right)
    ];
  }
  
  static mergeSort(tasks: Task[]): Task[] {
    if (tasks.length <= 1) return tasks;
    
    const middle = Math.floor(tasks.length / 2);
    const left = tasks.slice(0, middle);
    const right = tasks.slice(middle);
    
    return SortingAlgorithms.merge(
      SortingAlgorithms.mergeSort(left),
      SortingAlgorithms.mergeSort(right)
    );
  }
  
  private static merge(left: Task[], right: Task[]): Task[] {
    const result: Task[] = [];
    let leftIndex = 0;
    let rightIndex = 0;
    
    const priorityOrder = { 
      [TaskPriority.URGENT]: 0, 
      [TaskPriority.HIGH]: 1, 
      [TaskPriority.MEDIUM]: 2, 
      [TaskPriority.LOW]: 3 
    };
    
    while (leftIndex < left.length && rightIndex < right.length) {
      if (priorityOrder[left[leftIndex].priority] <= priorityOrder[right[rightIndex].priority]) {
        result.push(left[leftIndex]);
        leftIndex++;
      } else {
        result.push(right[rightIndex]);
        rightIndex++;
      }
    }
    
    return result.concat(left.slice(leftIndex), right.slice(rightIndex));
  }
  
  static generateTestTasks(count: number): Task[] {
    const tasks: Task[] = [];
    const priorityValues = Object.values(TaskPriority);
    const statusValues = Object.values(TaskStatus);
    
    for (let i = 0; i < count; i++) {
      const priority = priorityValues[Math.floor(Math.random() * priorityValues.length)] as TaskPriority;
      const status = statusValues[i % statusValues.length] as TaskStatus;
      
      tasks.push({
        id: `task-${i}`,
        title: `Task ${i}`,
        description: `Description for task ${i}`,
        priority,
        status,
        reporterId: `user-${i % 10}`,
        assigneeId: `user-${(i + 1) % 10}`,
        createdAt: new Date(),
      });
    }
    
    return tasks;
  }
}

defineFeature(feature, (test) => {
  let taskService: any;
  let tasksRepository: any;
  let boardsRepository: any;
  let httpService: any;
  let testContext: any = {};
  
  beforeEach(async () => {
    const module = await BddTestingModule.createTaskModule();
    taskService = module.taskService;
    tasksRepository = module.tasksRepository;
    boardsRepository = module.boardsRepository;
    httpService = module.httpService;
    testContext = {};
  });

  test('Создание новой задачи с назначением исполнителя', ({ given, and, when, then }) => {
    given('пользователь "project_manager" аутентифицирован в системе', () => {
      testContext.currentUserId = 'project_manager';
    });

    and('у пользователя есть доступ к доске "board_main"', () => {
      boardsRepository.findOne.mockResolvedValue({
        id: 'board_main',
        name: 'Main Board',
      });
    });

    and('на доске настроены статусы: TODO, IN_PROGRESS, REVIEW, DONE', () => {
      // Для теста достаточно знать, что статусы существуют
    });

    given('я открываю доску "board_main"', () => {
      testContext.boardId = 'board_main';
    });

    and(/^я заполняю форму создания задачи:$/, (table: any[]) => {
      const data = table.reduce((acc, row) => {
        const key = row.Поле.toLowerCase();
        const value = row.Значение.replace(/"/g, '');
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);
      
      testContext.createTaskDto = {
        title: data.заголовок,
        description: data.описание,
        assigneeId: data.исполнитель,
        priority: TaskPriority[data.приоритет as keyof typeof TaskPriority],
        status: TaskStatus.TODO,
      };
    });

    when('я нажимаю кнопку "Создать задачу"', async () => {
      httpService.get.mockReturnValue(Promise.resolve({ data: { id: 'developer_team' } }));
      tasksRepository.create.mockReturnValue(testContext.createTaskDto);
      tasksRepository.save.mockResolvedValue({
        ...testContext.createTaskDto,
        id: 'task-' + Date.now(),
        boardId: testContext.boardId,
        reporterId: testContext.currentUserId,
      });
      
      testContext.result = await taskService.createTask(
        testContext.boardId,
        testContext.createTaskDto,
        testContext.currentUserId
      );
    });

    then('задача должна быть создана с уникальным ID', () => {
      expect(testContext.result.id).toBeDefined();
      expect(testContext.result.id.startsWith('task-')).toBeTruthy();
    });

    and('статус задачи должен быть "TODO"', () => {
      expect(testContext.result.status).toBe(TaskStatus.TODO);
    });

    and('исполнитель "developer_team" должен получить уведомление', () => {
      expect(httpService.post).toHaveBeenCalled();
    });
  });

  test('Сравнение алгоритмов сортировки задач', ({ given, and, when, then, but }) => {
    given(/^у меня есть набор из (\d+) задач с разными приоритетами$/, (count: string) => {
      testContext.taskCount = parseInt(count);
      testContext.tasks = SortingAlgorithms.generateTestTasks(testContext.taskCount);
    });

    and('каждый алгоритм должен отсортировать задачи по приоритету', () => {
      testContext.comparator = (a: Task, b: Task) => {
        const priorityOrder = { 
          [TaskPriority.URGENT]: 0, 
          [TaskPriority.HIGH]: 1, 
          [TaskPriority.MEDIUM]: 2, 
          [TaskPriority.LOW]: 3 
        };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      };
    });

    when('я применяю алгоритм быстрой сортировки (quicksort)', () => {
      const startTime = performance.now();
      testContext.quickSortResult = SortingAlgorithms.quickSort([...testContext.tasks]);
      testContext.quickSortTime = performance.now() - startTime;
    });

    and('я применяю алгоритм сортировки слиянием (mergesort)', () => {
      const startTime = performance.now();
      testContext.mergeSortResult = SortingAlgorithms.mergeSort([...testContext.tasks]);
      testContext.mergeSortTime = performance.now() - startTime;
    });

    then('результаты сортировки должны быть идентичными', () => {
      expect(testContext.quickSortResult.length).toBe(testContext.mergeSortResult.length);
      
      for (let i = 0; i < testContext.quickSortResult.length; i++) {
        expect(testContext.quickSortResult[i].id).toBe(testContext.mergeSortResult[i].id);
      }
    });

    and('время выполнения каждого алгоритма должно быть замерено', () => {
      expect(testContext.quickSortTime).toBeGreaterThan(0);
      expect(testContext.mergeSortTime).toBeGreaterThan(0);
      console.log(`Quicksort: ${testContext.quickSortTime.toFixed(2)}ms`);
      console.log(`Mergesort: ${testContext.mergeSortTime.toFixed(2)}ms`);
    });

    and(/^алгоритм (.+) должен быть быстрее$/, (expectedFaster: string) => {
      if (expectedFaster === 'quicksort') {
        expect(testContext.quickSortTime).toBeLessThan(testContext.mergeSortTime);
      } else {
        expect(testContext.mergeSortTime).toBeLessThan(testContext.quickSortTime);
      }
    });

    but(/^разница во времени не должна превышать (\d+)%$/, (maxDifference: string) => {
      const timeDifference = Math.abs(testContext.quickSortTime - testContext.mergeSortTime);
      const avgTime = (testContext.quickSortTime + testContext.mergeSortTime) / 2;
      const percentageDifference = (timeDifference / avgTime) * 100;
      
      expect(percentageDifference).toBeLessThanOrEqual(parseInt(maxDifference));
    });
  });
});