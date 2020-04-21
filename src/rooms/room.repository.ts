import { Repository, EntityRepository ,getRepository,Between,LessThanOrEqual, MoreThanOrEqual, LessThan} from 'typeorm';
import { Room } from './entity/room.entity';
import { CreateRoomDto } from './dto/create-room.dto';
import { RoomStatus } from './room-status.enum';
import { GetRoomsFilterDto } from './dto/get-room-filter';
import { FacilityRepository } from 'src/facility/facility.repository';
import { Booking } from 'src/booking/entities/Booking.entity';
import { NotFoundException } from '@nestjs/common';


@EntityRepository(Room)
export class RoomRepository extends Repository<Room>{

    async getRooms(filterDto: GetRoomsFilterDto,
        facilityRepository:FacilityRepository,
        ):Promise<any>{
        const query = this.createQueryBuilder('room');
        const {beds,category,search,minimum,maximum,district,checkin,checkout,type,hotelid,roomid} = filterDto;
        const notAvailable= [];
        if(type.localeCompare("hotel")===0){

        const query = this.createQueryBuilder('room');
        if(district)
        {   const id = [];
            const facility = await facilityRepository.find({district});
            for(let i=0;i<facility.length;i++)
            {
                 id.push(facility[i].id);
            }
            if(id.length>0){
                query.andWhere('room.hotelId IN (:...id)',{id}); 
            }
            else{
                throw new NotFoundException(`Not available at ${district} `);
            }
        }
        if(beds)
        {
            query.andWhere('room.beds = :beds',{beds});
        }
        if(category){
            query.andWhere('room.category = :category',{category});
        }
        if(minimum && maximum){
            query.andWhere('room.cost >= :minimum AND room.cost <= :maximum',{minimum,maximum});
        }
        //query to find rooms based on check in and check out
        if(checkin && checkout)
        {
            const bookingRepository = getRepository(Booking); 
            const bookId = await bookingRepository.find({
                where: [
                    {checkin:LessThanOrEqual(checkin) ,checkout:MoreThanOrEqual(checkout)},
                    {checkin:LessThan(checkin) ,checkout:MoreThanOrEqual(checkout)},
                    {checkin:MoreThanOrEqual(checkin) ,checkout:LessThanOrEqual(checkout)},
                    {checkin:Between(checkin,checkout)},
                    {checkin:LessThanOrEqual(checkin),checkout:Between(checkin,checkout)} ,                   

                  ],
            });
            for(let i=0;i<bookId.length;i++){
                notAvailable.push(bookId && bookId[i].room &&  bookId[i].room.id);
            }
            if(bookId.length>0)
            {
             query.andWhere("room.id NOT IN (:...ids)",{ids:notAvailable});
            }
        }
        if(search){
            query.andWhere('(room.title LIKE :search OR room.description LIKE :search OR room.status LIKE :search)',{search: `%${search}%`});
        }

    const[room,count]= await query.getManyAndCount();
    //from all the rooms extract unique hotel id's
    const list= [];
    for(let i=0; i < count;i++)
    {
        const id = (room[i] && room[i].facility.id);
        if(list.indexOf(id)=== -1 )
        {
            list.push(id);
        }
    }
    //get the hotel details based on id's
    const hotels = [];
    for(const i in list)
    {
        const finalHotel = await facilityRepository.findOne({id:list[i]});
        hotels.push(finalHotel);
    }
    return hotels;
    }
    else {
        //query to find rooms based on check in and check out
        if(checkin && checkout)
        {   
            const bookingRepository = getRepository(Booking); 
            const bookId = await bookingRepository.find({
                where: [
                    {checkin:LessThanOrEqual(checkin) ,checkout:MoreThanOrEqual(checkout)},
                    {checkin:LessThan(checkin) ,checkout:MoreThanOrEqual(checkout)},
                    {checkin:MoreThanOrEqual(checkin) ,checkout:LessThanOrEqual(checkout)},
                    {checkin:Between(checkin,checkout)},
                    {checkin:LessThanOrEqual(checkin),checkout:Between(checkin,checkout)} ,                   

                  ],
            });
            for(let i = 0; i<bookId.length;i++){

                notAvailable.push(bookId[i].room.id);  
            }
            if(bookId.length>0)
            {
                if(hotelid){
                    query.where("room.id NOT IN (:...ids) AND room.hotelId = :hotelId",{ids:notAvailable,hotelId:hotelid});
                }
                if(roomid)
                {
                    query.where("room.id NOT IN (:...ids) AND room.id = :roomId",{ids:notAvailable,roomId:roomid});
                }
            }
            else{
                if(hotelid){
                    query.andWhere("room.hotelId = :hotelId",{hotelId:hotelid});
                }
                if(roomid)
                {
                    query.andWhere("room.id = :roomId",{roomId:roomid});
                }
            }
            if(category){
                query.andWhere('room.category = :category',{category});
            }
          
        }
        const rooms= await query.getMany();
        if(rooms.length>0)
        {
        return rooms;
        }
        else{
            console.log("Rooms not available");
          throw new NotFoundException(`Rooms not available`);
        }
    }
 }

    async getPrice():Promise<any>{
        const details = [];
        const query = this.createQueryBuilder("room");
        details.push(await query.select("DISTINCT(room.category)","category").getRawMany());
        details.push(await query.select("MIN(room.cost)","minimum")
        .addSelect("MAX(room.cost)","maximum")
        .getRawMany());
        return details;
    }
    
            
    //Create Room
    async createRoom(createRoomDto: CreateRoomDto,id:number,facilityRepository:FacilityRepository):Promise<any>{

        const roomId = [];
        const facility = await facilityRepository.findOne(id);
        const {noOfRooms,photos,title,features,description,category,beds,cost}=createRoomDto;
        for(let i=0; i<noOfRooms;i++)
        { 
        const room = new Room();
        room.facility = facility;
        room.title=title;
        room.features=features;
        room.description=description;
        room.category=category;
        room.beds=beds;
        room.photos=photos; //need to be done
        room.cost=cost;
        room.status=RoomStatus.AVAILABLE;
        await room.save();
        roomId.push(room);
        }
        return roomId;
        

    }
}
