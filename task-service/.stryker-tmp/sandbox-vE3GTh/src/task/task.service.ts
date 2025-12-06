/* eslint-disable prettier/prettier */
// @ts-nocheck
function stryNS_9fa48() {
  var g = typeof globalThis === 'object' && globalThis && globalThis.Math === Math && globalThis || new Function("return this")();
  var ns = g.__stryker__ || (g.__stryker__ = {});
  if (ns.activeMutant === undefined && g.process && g.process.env && g.process.env.__STRYKER_ACTIVE_MUTANT__) {
    ns.activeMutant = g.process.env.__STRYKER_ACTIVE_MUTANT__;
  }
  function retrieveNS() {
    return ns;
  }
  stryNS_9fa48 = retrieveNS;
  return retrieveNS();
}
stryNS_9fa48();
function stryCov_9fa48() {
  var ns = stryNS_9fa48();
  var cov = ns.mutantCoverage || (ns.mutantCoverage = {
    static: {},
    perTest: {}
  });
  function cover() {
    var c = cov.static;
    if (ns.currentTestId) {
      c = cov.perTest[ns.currentTestId] = cov.perTest[ns.currentTestId] || {};
    }
    var a = arguments;
    for (var i = 0; i < a.length; i++) {
      c[a[i]] = (c[a[i]] || 0) + 1;
    }
  }
  stryCov_9fa48 = cover;
  cover.apply(null, arguments);
}
function stryMutAct_9fa48(id) {
  var ns = stryNS_9fa48();
  function isActive(id) {
    if (ns.activeMutant === id) {
      if (ns.hitCount !== void 0 && ++ns.hitCount > ns.hitLimit) {
        throw new Error('Stryker: Hit count limit reached (' + ns.hitCount + ')');
      }
      return true;
    }
    return false;
  }
  stryMutAct_9fa48 = isActive;
  return isActive(id);
}
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Task } from '../entities/task.entity';
import { Board } from '../entities/board.entity';
import { Sprint } from '../entities/sprint.entity';
import { CreateTaskDto, TaskStatus, UpdateTaskDto } from '../../types/src';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class TaskService {
  constructor(@InjectRepository(Task)
  private readonly tasksRepository: Repository<Task>, @InjectRepository(Board)
  private readonly boardsRepository: Repository<Board>, @InjectRepository(Sprint)
  private readonly sprintsRepository: Repository<Sprint>, private readonly httpService: HttpService) {}
  async getBoardById(boardId: string): Promise<Board> {
    if (stryMutAct_9fa48("0")) {
      {}
    } else {
      stryCov_9fa48("0");
      const board = await this.boardsRepository.findOne(stryMutAct_9fa48("1") ? {} : (stryCov_9fa48("1"), {
        where: stryMutAct_9fa48("2") ? {} : (stryCov_9fa48("2"), {
          id: boardId
        }),
        relations: stryMutAct_9fa48("3") ? [] : (stryCov_9fa48("3"), [stryMutAct_9fa48("4") ? "" : (stryCov_9fa48("4"), 'tasks')])
      }));
      if (stryMutAct_9fa48("7") ? false : stryMutAct_9fa48("6") ? true : stryMutAct_9fa48("5") ? board : (stryCov_9fa48("5", "6", "7"), !board)) {
        if (stryMutAct_9fa48("8")) {
          {}
        } else {
          stryCov_9fa48("8");
          throw new NotFoundException(stryMutAct_9fa48("9") ? "" : (stryCov_9fa48("9"), 'Board not found'));
        }
      }
      return board;
    }
  }
  async createTask(boardId: string, createTaskDto: CreateTaskDto, currentUserId: string): Promise<Task> {
    if (stryMutAct_9fa48("10")) {
      {}
    } else {
      stryCov_9fa48("10");
      const board = await this.getBoardById(boardId);
      try {
        if (stryMutAct_9fa48("11")) {
          {}
        } else {
          stryCov_9fa48("11");
          await firstValueFrom(this.httpService.get(stryMutAct_9fa48("12") ? `` : (stryCov_9fa48("12"), `${stryMutAct_9fa48("15") ? process.env.API_GATEWAY_URL && 'http://api-gateway:3000' : stryMutAct_9fa48("14") ? false : stryMutAct_9fa48("13") ? true : (stryCov_9fa48("13", "14", "15"), process.env.API_GATEWAY_URL || (stryMutAct_9fa48("16") ? "" : (stryCov_9fa48("16"), 'http://api-gateway:3000')))}/users/${createTaskDto.assigneeId}`)));
        }
      } catch (error) {
        if (stryMutAct_9fa48("17")) {
          {}
        } else {
          stryCov_9fa48("17");
          // console.log('Error', error)
          // console.warn(`Assignee ${createTaskDto.assigneeId} not found, using current user: ${currentUserId}`);
          createTaskDto.assigneeId = currentUserId;
        }
      }
      const task = this.tasksRepository.create(stryMutAct_9fa48("18") ? {} : (stryCov_9fa48("18"), {
        ...createTaskDto,
        boardId: board.id,
        reporterId: currentUserId,
        status: stryMutAct_9fa48("21") ? createTaskDto.status && TaskStatus.TODO : stryMutAct_9fa48("20") ? false : stryMutAct_9fa48("19") ? true : (stryCov_9fa48("19", "20", "21"), createTaskDto.status || TaskStatus.TODO)
      }));
      const savedTask = await this.tasksRepository.save(task);
      if (stryMutAct_9fa48("24") ? createTaskDto.assigneeId === currentUserId : stryMutAct_9fa48("23") ? false : stryMutAct_9fa48("22") ? true : (stryCov_9fa48("22", "23", "24"), createTaskDto.assigneeId !== currentUserId)) {
        if (stryMutAct_9fa48("25")) {
          {}
        } else {
          stryCov_9fa48("25");
          await this.sendNotification(stryMutAct_9fa48("26") ? {} : (stryCov_9fa48("26"), {
            userId: createTaskDto.assigneeId,
            title: stryMutAct_9fa48("27") ? "" : (stryCov_9fa48("27"), 'Новая задача назначена'),
            message: stryMutAct_9fa48("28") ? `` : (stryCov_9fa48("28"), `Вам назначена задача "${createTaskDto.title}"`),
            type: stryMutAct_9fa48("29") ? "" : (stryCov_9fa48("29"), 'task_assigned'),
            data: stryMutAct_9fa48("30") ? {} : (stryCov_9fa48("30"), {
              taskId: savedTask.id,
              boardId: boardId,
              assignedBy: currentUserId
            })
          }));
        }
      }
      return savedTask;
    }
  }
  async getBoardTasks(boardId: string): Promise<Task[]> {
    if (stryMutAct_9fa48("31")) {
      {}
    } else {
      stryCov_9fa48("31");
      await this.getBoardById(boardId);
      return this.tasksRepository.find(stryMutAct_9fa48("32") ? {} : (stryCov_9fa48("32"), {
        where: stryMutAct_9fa48("33") ? {} : (stryCov_9fa48("33"), {
          boardId
        }),
        order: stryMutAct_9fa48("34") ? {} : (stryCov_9fa48("34"), {
          order: stryMutAct_9fa48("35") ? "" : (stryCov_9fa48("35"), 'ASC'),
          createdAt: stryMutAct_9fa48("36") ? "" : (stryCov_9fa48("36"), 'DESC')
        })
      }));
    }
  }
  async getTaskById(taskId: string): Promise<Task> {
    if (stryMutAct_9fa48("37")) {
      {}
    } else {
      stryCov_9fa48("37");
      const task = await this.tasksRepository.findOne(stryMutAct_9fa48("38") ? {} : (stryCov_9fa48("38"), {
        where: stryMutAct_9fa48("39") ? {} : (stryCov_9fa48("39"), {
          id: taskId
        })
      }));
      if (stryMutAct_9fa48("42") ? false : stryMutAct_9fa48("41") ? true : stryMutAct_9fa48("40") ? task : (stryCov_9fa48("40", "41", "42"), !task)) {
        if (stryMutAct_9fa48("43")) {
          {}
        } else {
          stryCov_9fa48("43");
          throw new NotFoundException(stryMutAct_9fa48("44") ? "" : (stryCov_9fa48("44"), 'Task not found'));
        }
      }
      return task;
    }
  }
  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    if (stryMutAct_9fa48("45")) {
      {}
    } else {
      stryCov_9fa48("45");
      const task = await this.tasksRepository.findOne(stryMutAct_9fa48("46") ? {} : (stryCov_9fa48("46"), {
        where: stryMutAct_9fa48("47") ? {} : (stryCov_9fa48("47"), {
          id: taskId
        })
      }));
      if (stryMutAct_9fa48("50") ? false : stryMutAct_9fa48("49") ? true : stryMutAct_9fa48("48") ? task : (stryCov_9fa48("48", "49", "50"), !task)) {
        if (stryMutAct_9fa48("51")) {
          {}
        } else {
          stryCov_9fa48("51");
          throw new NotFoundException(stryMutAct_9fa48("52") ? "" : (stryCov_9fa48("52"), 'Task not found'));
        }
      }
      Object.assign(task, updateTaskDto);
      task.updatedAt = new Date();
      return await this.tasksRepository.save(task);
    }
  }
  async updateTaskStatus(taskId: string, status: TaskStatus, order: number): Promise<Task> {
    if (stryMutAct_9fa48("53")) {
      {}
    } else {
      stryCov_9fa48("53");
      const task = await this.tasksRepository.findOne(stryMutAct_9fa48("54") ? {} : (stryCov_9fa48("54"), {
        where: stryMutAct_9fa48("55") ? {} : (stryCov_9fa48("55"), {
          id: taskId
        })
      }));
      if (stryMutAct_9fa48("58") ? false : stryMutAct_9fa48("57") ? true : stryMutAct_9fa48("56") ? task : (stryCov_9fa48("56", "57", "58"), !task)) {
        if (stryMutAct_9fa48("59")) {
          {}
        } else {
          stryCov_9fa48("59");
          throw new NotFoundException(stryMutAct_9fa48("60") ? "" : (stryCov_9fa48("60"), 'Task not found'));
        }
      }
      task.status = status;
      task.order = order;
      return this.tasksRepository.save(task);
    }
  }
  async deleteTask(taskId: string, userId: string): Promise<Task> {
    if (stryMutAct_9fa48("61")) {
      {}
    } else {
      stryCov_9fa48("61");
      const task = await this.tasksRepository.findOne(stryMutAct_9fa48("62") ? {} : (stryCov_9fa48("62"), {
        where: stryMutAct_9fa48("63") ? {} : (stryCov_9fa48("63"), {
          id: taskId
        })
      }));
      if (stryMutAct_9fa48("66") ? false : stryMutAct_9fa48("65") ? true : stryMutAct_9fa48("64") ? task : (stryCov_9fa48("64", "65", "66"), !task)) {
        if (stryMutAct_9fa48("67")) {
          {}
        } else {
          stryCov_9fa48("67");
          throw new NotFoundException(stryMutAct_9fa48("68") ? "" : (stryCov_9fa48("68"), 'Task not found'));
        }
      }
      if (stryMutAct_9fa48("71") ? task.reporterId === userId : stryMutAct_9fa48("70") ? false : stryMutAct_9fa48("69") ? true : (stryCov_9fa48("69", "70", "71"), task.reporterId !== userId)) {
        if (stryMutAct_9fa48("72")) {
          {}
        } else {
          stryCov_9fa48("72");
          throw new ForbiddenException(stryMutAct_9fa48("73") ? "" : (stryCov_9fa48("73"), 'You can only delete tasks you created'));
        }
      }
      return this.tasksRepository.remove(task);
    }
  }
  async getUserAssignedTasks(userId: string): Promise<Task[]> {
    if (stryMutAct_9fa48("74")) {
      {}
    } else {
      stryCov_9fa48("74");
      return this.tasksRepository.find(stryMutAct_9fa48("75") ? {} : (stryCov_9fa48("75"), {
        where: stryMutAct_9fa48("76") ? {} : (stryCov_9fa48("76"), {
          assigneeId: userId
        }),
        relations: stryMutAct_9fa48("77") ? [] : (stryCov_9fa48("77"), [stryMutAct_9fa48("78") ? "" : (stryCov_9fa48("78"), 'board')]),
        order: stryMutAct_9fa48("79") ? {} : (stryCov_9fa48("79"), {
          createdAt: stryMutAct_9fa48("80") ? "" : (stryCov_9fa48("80"), 'DESC')
        })
      }));
    }
  }
  async getBacklogTasks(boardId: string): Promise<Task[]> {
    if (stryMutAct_9fa48("81")) {
      {}
    } else {
      stryCov_9fa48("81");
      return this.tasksRepository.find(stryMutAct_9fa48("82") ? {} : (stryCov_9fa48("82"), {
        where: stryMutAct_9fa48("83") ? {} : (stryCov_9fa48("83"), {
          boardId,
          sprintId: IsNull(),
          status: TaskStatus.BACKLOG
        }),
        order: stryMutAct_9fa48("84") ? {} : (stryCov_9fa48("84"), {
          order: stryMutAct_9fa48("85") ? "" : (stryCov_9fa48("85"), 'ASC')
        })
      }));
    }
  }
  async findBySprint(sprintId: string): Promise<Task[]> {
    if (stryMutAct_9fa48("86")) {
      {}
    } else {
      stryCov_9fa48("86");
      return this.tasksRepository.find(stryMutAct_9fa48("87") ? {} : (stryCov_9fa48("87"), {
        where: stryMutAct_9fa48("88") ? {} : (stryCov_9fa48("88"), {
          sprintId
        })
      }));
    }
  }
  async findTaskById(taskId: string): Promise<Task> {
    if (stryMutAct_9fa48("89")) {
      {}
    } else {
      stryCov_9fa48("89");
      const task = await this.tasksRepository.findOne(stryMutAct_9fa48("90") ? {} : (stryCov_9fa48("90"), {
        where: stryMutAct_9fa48("91") ? {} : (stryCov_9fa48("91"), {
          id: taskId
        })
      }));
      if (stryMutAct_9fa48("94") ? false : stryMutAct_9fa48("93") ? true : stryMutAct_9fa48("92") ? task : (stryCov_9fa48("92", "93", "94"), !task)) throw new NotFoundException();
      return task;
    }
  }
  private async sendNotification(notificationData: any) {
    if (stryMutAct_9fa48("95")) {
      {}
    } else {
      stryCov_9fa48("95");
      try {
        if (stryMutAct_9fa48("96")) {
          {}
        } else {
          stryCov_9fa48("96");
          await firstValueFrom(this.httpService.post(stryMutAct_9fa48("97") ? `` : (stryCov_9fa48("97"), `${stryMutAct_9fa48("100") ? process.env.API_GATEWAY_URL && 'http://api-gateway:3000' : stryMutAct_9fa48("99") ? false : stryMutAct_9fa48("98") ? true : (stryCov_9fa48("98", "99", "100"), process.env.API_GATEWAY_URL || (stryMutAct_9fa48("101") ? "" : (stryCov_9fa48("101"), 'http://api-gateway:3000')))}/notifications`), notificationData));
        }
      } catch (error) {
        // console.error('Failed to send notification:', error);
      }
    }
  }
}