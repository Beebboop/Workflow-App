/* eslint-disable prettier/prettier */
// @ts-nocheck

import { Controller, Get, Post, Put, Body, Param, Headers, Delete } from '@nestjs/common';
import { ScrumService } from './scrum.service';
import { CreateSprintDto, SprintStatus, UpdateSprintDto } from '../../types/src';

@Controller('scrum')
export class ScrumController {
  constructor(
    private readonly scrumService: ScrumService, 
) {}

    @Post('sprints')
    async createSprint(@Body() createSprintDto: CreateSprintDto) {
        return this.scrumService.createSprint(createSprintDto);
    }

    @Post(':sprintId/complete')
    async completeSprint(
        @Param('sprintId') sprintId: string,
        @Body() updateSprintDto: UpdateSprintDto){
        return this.scrumService.completeSprint(sprintId, updateSprintDto)
    }

    @Get('boards/:boardId/sprints')
    async getSprints(
        @Param('boardId') boardId: string,
        @Headers('x-user-id') userId: string) {
        return this.scrumService.getSprints(boardId, userId);
    }

    @Get('boards/:boardId/active-sprint')
    async getActiveSprint(@Param('boardId') boardId: string) {
        return this.scrumService.getActiveSprint(boardId);
    }

    @Put('sprints/:sprintId/status')
    async updateSprintStatus(@Param('sprintId') sprintId: string, @Body('status') status: SprintStatus) {
        return this.scrumService.updateSprintStatus(sprintId, status);
    }

    @Get('sprints/:sprintId/stats')
    async getSprintStats(@Param('sprintId') sprintId: string) {
        return this.scrumService.getSprintStats(sprintId);
    }

    @Put('sprints/:sprintId/tasks')
    async addTasksToSprint(@Param('sprintId') sprintId: string, @Body('taskIds') taskIds: string[]) {
        return this.scrumService.addTasksToSprint(sprintId, taskIds);
    }
    
    @Delete('sprints/:sprintId')
    async deleteSprint(@Param('sprintId') sprintId: string) {
        return this.scrumService.deleteSprint(sprintId);
    }
    @Put('sprints/:sprintId/team')
        async updateSprintTeam(
            @Param('sprintId') sprintId: string,
            @Body() teamData: { scrumMasterId: string; teamMembers: string[] }
        ) {
        return this.scrumService.updateSprintTeam(sprintId, teamData);
    }

}