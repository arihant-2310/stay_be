import { Controller, Get ,Post, Body,Param, Delete,Patch,Query, ValidationPipe, UsePipes, ParseIntPipe,UseGuards, Req, UseInterceptors, UploadedFiles } from '@nestjs/common';
import {RoomsService} from './rooms.service';
import {CreateRoomDto} from './dto/create-room.dto';
import { GetRoomsFilterDto } from './dto/get-room-filter';
import {RoomStatusValidationPipe} from './pipes/room-status-validation.pipe'
import { Room } from './entity/room.entity';
import { RoomStatus } from './room-status.enum';
import { ApiUseTags,ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { FilesInterceptor } from '@nestjs/platform-express';
import * as multerS3 from 'multer-s3';
const S3Client = require('aws-s3');

const config = {
    bucketName: '',
    region: '',
    accessKeyId: '',
    secretAccessKey: '',
}
const AWS_S3_BUCKET_NAME = '';
const S3 = new S3Client(config);


@ApiUseTags('Rooms Management')
@Controller('api/v1/rooms')
export class RoomsController {
    constructor(private roomsService: RoomsService) {}

    @Get('/')
    getRooms(@Query(ValidationPipe) filterDto:GetRoomsFilterDto){
        return this.roomsService.getRooms(filterDto);
    }

    @Get('/:id')
    getRoomById(@Param('id',ParseIntPipe) id:number):Promise<Room>{
        return this.roomsService.getRoomById(id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Post('/:hotelid')
    @UsePipes(ValidationPipe)
    @UseInterceptors(
      FilesInterceptor('file',5,{
      storage: multerS3({
        s3: S3,
        bucket: AWS_S3_BUCKET_NAME,
        acl: 'public-read',
        key: function(request, file, cb) {
          cb(null, `${Date.now().toString()} - ${file.originalname}`);
        },
      }),
    //   fileFilter: imageFileFilter,
    }),
    )
    createRoom(
        @Req() req:any,
        @Param('hotelid') id:number,
        @UploadedFiles() file,
        @Body() createRoomDto : CreateRoomDto,
    ):Promise<Room>
    {   
//      S3Client
//     .uploadFile(file,req.files)
//     .then(data => console.log(data))
//     .catch(err => console.error(err))
	console.log(req.files);
        return this.roomsService.createRoom(req.user,createRoomDto,id);  
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Delete('/:id')
    deleteRoom(@Req() req:any,@Param('id',ParseIntPipe) id:number):Promise<void>{
        return this.roomsService.deleteRoom(req.user,id);
    }

    @ApiBearerAuth()
    @UseGuards(AuthGuard('jwt'))
    @Patch('/status/:id')
    updateRoomStatus(
      @Req() req:any,
     @Param('id',ParseIntPipe)id:number,
     @Body('status',RoomStatusValidationPipe) status:RoomStatus):Promise<Room>
     {
            return this.roomsService.updateRoomStatus(req.user,id,status);
     } 
     @Get('/hotel/:hotelId')
	 getHotelDetail(@Param('hotelId',ParseIntPipe) hotelId: number): Promise<any> {
		 return this.roomsService.getHotelDetail(hotelId);
	 }
	 @Get('/hotelid/:facilityId')
	 getHotelId(@Param('facilityId',ParseIntPipe) facilityId:number):Promise<any> {
		 return this.roomsService.getHotelId(facilityId);
     }
     @Get('/get/details')
     getPrice():Promise<any>{

         return this.roomsService.getPrice();
     }

}
