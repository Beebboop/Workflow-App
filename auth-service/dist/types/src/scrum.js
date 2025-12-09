"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateSprintDto = exports.CreateSprintDto = exports.SprintStatus = exports.SprintRole = void 0;
var SprintRole;
(function (SprintRole) {
    SprintRole["SCRUM_MASTER"] = "scrum_master";
    SprintRole["TEAM_MEMBER"] = "team_member";
})(SprintRole || (exports.SprintRole = SprintRole = {}));
var SprintStatus;
(function (SprintStatus) {
    SprintStatus["PLANNING"] = "planning";
    SprintStatus["ACTIVE"] = "active";
    SprintStatus["COMPLETED"] = "completed";
})(SprintStatus || (exports.SprintStatus = SprintStatus = {}));
class CreateSprintDto {
    name = '';
    goal = '';
    startDate;
    endDate;
    boardId = '';
    scrumMasterId = '';
    teamMembers = [];
    constructor(data) {
        if (data) {
            Object.assign(this, data);
        }
    }
}
exports.CreateSprintDto = CreateSprintDto;
class UpdateSprintDto {
    name = '';
    goal = '';
    startDate;
    endDate;
    boardId = '';
    scrumMasterId = '';
    teamMembers = [];
    status;
    velocity;
    completedPoints;
    createdAt;
    updatedAt;
}
exports.UpdateSprintDto = UpdateSprintDto;
//# sourceMappingURL=scrum.js.map