/* eslint-disable prettier/prettier */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sprint } from '../entities/sprint.entity';
import { Task } from '../entities/task.entity';
import { Board } from '../entities/board.entity';
import { CreateSprintDto, SprintStatus, SprintStats, TaskStatus, UpdateSprintDto } from '../../types/src';
import { HttpService } from '@nestjs/axios';


@Injectable()
export class ScrumService {
    constructor(
        @InjectRepository(Sprint)
        private readonly sprintsRepository: Repository<Sprint>,
        @InjectRepository(Task)
        private readonly tasksRepository: Repository<Task>,
        @InjectRepository(Board)
        private readonly boardsRepository: Repository<Board>,
        private readonly httpService: HttpService,
    ) {}

    async createSprint(createSprintDto: CreateSprintDto): Promise<Sprint> {
        const board = await this.boardsRepository.findOne({ where: { id: createSprintDto.boardId } });
        if (!board) {
        throw new NotFoundException('Board not found');
        }

        // Устанавливаем статус нового спринта как PLANNING
        const sprint = this.sprintsRepository.create({
        ...createSprintDto,
        status: SprintStatus.PLANNING,
        });
        const savedSprint = await this.sprintsRepository.save(sprint);

        // Добавляем участников спринта в members доски
        await this.addSprintMembersToBoard(savedSprint);

        await this.notifySprintCreated(savedSprint);

        return savedSprint;
    }

    private async addSprintMembersToBoard(sprint: Sprint): Promise<void> {
        const board = await this.boardsRepository.findOne({ 
            where: { id: sprint.boardId } 
        });
        
        if (!board) {
            console.warn(`Board ${sprint.boardId} not found for sprint ${sprint.id}`);
            return;
        }

        // Собираем всех участников: scrum master + team members
        const allMembers = new Set<string>();
        
        // Добавляем scrum master
        if (sprint.scrumMasterId) {
            allMembers.add(sprint.scrumMasterId);
        }
        
        // Добавляем team members
        if (sprint.teamMembers && sprint.teamMembers.length > 0) {
            sprint.teamMembers.forEach(memberId => allMembers.add(memberId));
        }

        // Инициализируем members доски
        if (!board.members) {
            board.members = [];
        }

        // Добавляем новых участников
        const newMembers = Array.from(allMembers).filter(
            memberId => !board.members.includes(memberId)
        );

        if (newMembers.length > 0) {
            board.members = [...board.members, ...newMembers];
            await this.boardsRepository.save(board);
            
            console.log(`Added ${newMembers.length} members to board ${board.id}:`, newMembers);
        }
    }

    async getActiveSprint(boardId: string): Promise<Sprint | null> {
        return this.sprintsRepository.findOne({
        where: { boardId, status: SprintStatus.ACTIVE },
        relations: ['tasks'],
        });
    }

    async updateSprintStatus(sprintId: string, status: SprintStatus): Promise<Sprint> {
        const sprint = await this.sprintsRepository.findOne({ where: { id: sprintId }, relations: ['tasks'] });
        if (!sprint) {
        throw new NotFoundException('Sprint not found');
        }

        if (status === SprintStatus.COMPLETED) {
        // Рассчитаем завершенные поинты
        let completedPoints = 0;
        sprint.tasks.forEach(task => {
            if (task.status === TaskStatus.DONE && task.storyPoints) {
            completedPoints += task.storyPoints;
            }
        });
        sprint.completedPoints = completedPoints;
        sprint.velocity = completedPoints; //  формула для соответствия объему задач(потом сделать с более жестким ограничением)
        }

        sprint.status = status;
        return this.sprintsRepository.save(sprint);
    }

    async getSprintStats(sprintId: string): Promise<SprintStats> {
        const sprint = await this.sprintsRepository.findOne({
        where: { id: sprintId },
        relations: ['tasks'],
        });
        if (!sprint) {
        throw new NotFoundException('Sprint not found');
        }

        const tasks = sprint.tasks;
        let totalPoints = 0;
        let completedPoints = 0;
        let completedTasks = 0;
        tasks.forEach(task => {
        const points = task.storyPoints || 0;
        totalPoints += points;
        if (task.status === TaskStatus.DONE) {
            completedPoints += points;
            completedTasks += 1;
        }
        });

        const remainingPoints = totalPoints - completedPoints;

        return {
        totalPoints,
        completedPoints,
        remainingPoints,
        completedTasks,
        totalTasks: tasks.length
        };
    }

    async getSprints(boardId: string, currentUserId?: string): Promise<Sprint[]> {
        if (currentUserId) {
        return this.sprintsRepository.find({
        where: { 
            boardId,
            // Пользователь должен быть scrum master или team member
        },
        relations: ['tasks'],
        order: { createdAt: 'DESC' },
        }).then(sprints => 
            sprints.filter(sprint => 
                sprint.scrumMasterId === currentUserId || 
                (sprint.teamMembers && sprint.teamMembers.includes(currentUserId))
            ));
        }

        return this.sprintsRepository.find({
        where: { boardId },
        relations: ['tasks'],
        order: { createdAt: 'DESC' },
        });
    }

    async addTasksToSprint(sprintId: string, taskIds: string[]): Promise<void> {
        const sprint = await this.sprintsRepository.findOne({ where: { id: sprintId }, relations: ['tasks'] });
        if (!sprint) {
        throw new NotFoundException('Sprint not found');
        }

        await this.tasksRepository.update(taskIds, { sprintId });
    }

    async deleteSprint(sprintId: string): Promise<void> {
        const sprint = await this.sprintsRepository.findOne({ 
            where: { id: sprintId },
            relations: ['tasks']
        });
        
        if (!sprint) {
            throw new NotFoundException('Sprint not found');
        }

        // Убираем связь с задачами
        if (sprint.tasks.length > 0) {
            await this.tasksRepository.update(
            sprint.tasks.map(task => task.id),
            { sprintId: null }
            );
        }

        await this.sprintsRepository.remove(sprint);
    }

    async updateSprintTeam(sprintId: string, teamData: { scrumMasterId: string; teamMembers: string[] }): Promise<Sprint> {
        const sprint = await this.sprintsRepository.findOne({ where: { id: sprintId } });
        if (!sprint) {
            throw new NotFoundException('Sprint not found');
        }

        // Обновляем команду спринта
        sprint.scrumMasterId = teamData.scrumMasterId;
        sprint.teamMembers = teamData.teamMembers;

        const updatedSprint = await this.sprintsRepository.save(sprint);

        // Обновляем members доски
        await this.addSprintMembersToBoard(updatedSprint);

        return updatedSprint;
     }
        
    async updateSprint(sprintId: string, updateSprintDto: UpdateSprintDto): Promise<Sprint> {
        const sprint = await this.sprintsRepository.findOne({ where: { id: sprintId } });
        if (!sprint) {
          throw new NotFoundException('Sprint not found');
        }

        // Обновляем только переданные поля
        Object.assign(sprint, updateSprintDto);
        sprint.updatedAt = new Date();
    
        return await this.sprintsRepository.save(sprint);
    }

    async completeSprint(sprintId: string, updateSprintDto: UpdateSprintDto): Promise<Sprint> {
            const sprint = await this.sprintsRepository.findOne({where: {id: sprintId}});
            if (!sprint || sprint.status !== SprintStatus.ACTIVE) {
            throw new Error('Sprint is not active and cannot be completed');
            }
    
            await this.sprintsRepository.update(sprintId, {
            ...updateSprintDto,
            status: SprintStatus.COMPLETED,
            });
            
            const updatedSprint = await this.sprintsRepository.findOne({ where: { id: sprintId } });
            if (!updatedSprint) {
                throw new Error('Sprint not found after update');
            }

            const tasks = await this.tasksRepository.find({ where: { sprintId } });
            for (const task of tasks) {
            if (task.status === TaskStatus.DONE) {
                // Завершённые: архивация 
                await this.tasksRepository.update(task.id, {
                    completedAt: new Date(),
                    status: TaskStatus.ARCHIVED
                });
            } else {
                // Незавершённые: вернуть в backlog
                await this.tasksRepository.update(task.id, {
                status: TaskStatus.BACKLOG,
                sprintId: null,  // Отвязать от спринта
                });
            }
            }
    
            return updatedSprint;
        }

    private async notifySprintCreated(sprint: Sprint): Promise<void> {
        try {
            // Собираем всех участников команды
            const teamMembers = new Set<string>();
            
            if (sprint.scrumMasterId) {
                teamMembers.add(sprint.scrumMasterId);
            }
            
            if (sprint.teamMembers && sprint.teamMembers.length > 0) {
                sprint.teamMembers.forEach(memberId => teamMembers.add(memberId));
            }

            const membersArray = Array.from(teamMembers);
            
            if (membersArray.length === 0) {
                console.log('No team members to notify for sprint:', sprint.id);
                return;
            }

            // Отправляем HTTP запрос в API Gateway
            await this.httpService.axiosRef.post(
                `${process.env.API_GATEWAY_URL || 'http://api-gateway:3000'}/events/sprint-created`,
                {
                    sprintId: sprint.id,
                    sprintName: sprint.name,
                    teamMembers: membersArray,
                }
            );

            console.log(`Notified API Gateway about sprint "${sprint.name}" creation for ${membersArray.length} team members`);
            
        } catch (error) {
            console.error('Failed to notify API Gateway about sprint creation:', error);
        }
    }   
}