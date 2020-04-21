import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Patch,
    Post,
    Query,
    Req, UploadedFile,
    UseGuards, UseInterceptors,
    UsePipes,
    ValidationPipe
} from '@nestjs/common';
import {RoomsService} from './rooms.service';
import {CreateRoomDto} from './dto/create-room.dto';
import {GetRoomsFilterDto} from './dto/get-room-filter';
import {RoomStatusValidationPipe} from './pipes/room-status-validation.pipe'
import {Room} from './entity/room.entity';
import {RoomStatus} from './room-status.enum';
import {ApiBearerAuth, ApiUseTags} from '@nestjs/swagger';
import {AuthGuard} from '@nestjs/passport';
import {FileInterceptor} from "@nestjs/platform-express";

@ApiUseTags('Rooms Management')
@Controller('api/v1/rooms')
export class RoomsController {
    constructor(private roomsService: RoomsService) {
    }

    @Get('/')
    getRooms(@Query(ValidationPipe) filterDto: GetRoomsFilterDto) {
        return this.roomsService.getRooms(filterDto);
    }

    @Get('/:id')
    getRoomById(@Param('id', ParseIntPipe) id: number): Promise<Room> {
        return this.roomsService.getRoomById(id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('/:hotelid')

    @UseInterceptors(FileInterceptor('file', {

    }))
    @UsePipes(ValidationPipe)
    createRoom(@Req() req: any, @Param('hotelid') id: number, @Body() createRoomDto: CreateRoomDto, @UploadedFile() file):
        Promise<any> {
        return this.roomsService.createRoom(req.user, createRoomDto, id, file.path);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete('/:id')
    deleteRoom(@Req() req: any, @Param('id', ParseIntPipe) id: number): Promise<void> {
        return this.roomsService.deleteRoom(req.user, id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Patch('/status/:id')
    updateRoomStatus(
        @Req() req: any,
        @Param('id', ParseIntPipe)id: number,
        @Body('status', RoomStatusValidationPipe) status: RoomStatus): Promise<Room> {
        return this.roomsService.updateRoomStatus(req.user, id, status);
    }

    @Get('/hotel/:hotelId')
    getHotelDetail(@Param('hotelId', ParseIntPipe) hotelId: number): Promise<any> {
        return this.roomsService.getHotelDetail(hotelId);
    }

    @Get('/hotelid/:facilityId')
    getHotelId(@Param('facilityId', ParseIntPipe) facilityId: number): Promise<any> {
        return this.roomsService.getHotelId(facilityId);
    }

    @Get('/get/details')
    getPrice(): Promise<any> {

        return this.roomsService.getPrice();
    }
}
