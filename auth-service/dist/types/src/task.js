"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTaskDto = exports.CreateTaskDto = exports.TaskPriority = exports.TaskStatus = void 0;
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["BACKLOG"] = "backlog";
    TaskStatus["TODO"] = "todo";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["REVIEW"] = "review";
    TaskStatus["DONE"] = "done";
    TaskStatus["ARCHIVED"] = "archived";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["URGENT"] = "urgent";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
class CreateTaskDto {
    title = '';
    description = '';
    priority = TaskPriority.MEDIUM;
    status = TaskStatus.TODO;
    assigneeId = '';
    reporterId = '';
    dueDate = undefined;
    estimate = undefined;
    completedAt = undefined;
    tags = [];
    boardId = '';
    sprintId = null;
    constructor(data) {
        if (data) {
            Object.assign(this, data);
        }
        this.status = this.status || TaskStatus.TODO;
    }
}
exports.CreateTaskDto = CreateTaskDto;
class UpdateTaskDto {
    title;
    description;
    priority;
    status;
    assigneeId;
    dueDate;
    estimate;
    completedAt;
    tags;
    storyPoints;
    order;
    sprintOrder;
    sprintId;
}
exports.UpdateTaskDto = UpdateTaskDto;
//# sourceMappingURL=task.js.map