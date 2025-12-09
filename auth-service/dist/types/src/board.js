"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateBoardDto = exports.BoardType = void 0;
var BoardType;
(function (BoardType) {
    BoardType["KANBAN"] = "kanban";
    BoardType["SCRUM"] = "scrum";
})(BoardType || (exports.BoardType = BoardType = {}));
class CreateBoardDto {
    name = '';
    type = BoardType.KANBAN;
    description = undefined;
    ownerId = '';
    members = [];
    constructor(data) {
        if (data) {
            Object.assign(this, data);
        }
    }
}
exports.CreateBoardDto = CreateBoardDto;
//# sourceMappingURL=board.js.map