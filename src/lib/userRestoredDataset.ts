import { parseCashewDataAsync, applyCashewImport } from './cashewImporter';
import { LocalStorageState } from '../types';

export const USER_RESTORE_CSV = `account,amount,amount unpaid,currency,title,note,date,income,type,category name,subcategory name,color,icon,emoji,budget,objective,extra
HDFC Bank,,-299,INR,YouTube Premium 🎥,,2026-09-21 20:49:12.000,false,subscription,Entertainment,,0XFF2196F3,popcorn,,,,repeat every 1 month
HDFC Bank,,-3500,INR,PPF & NPS,,2026-09-02 19:00:32.000,false,repetitive,Investments,,,piggy-bank,,,,repeat every 1 month
HDFC Bank,,-4000,INR,Grow SIP 💸,,2026-09-01 19:00:31.000,false,repetitive,Investments,,,piggy-bank,,,,repeat every 1 month
HDFC Bank,,-1469.78,INR,Axis Term Insurance,,2026-09-01 17:15:35.000,false,repetitive,Insurance,,0XFF32983F,,🛡,,,repeat every 1 month
Federal Bank,-5284.5,,INR,Train,"BLR - HYD : Aisha, Jafar & Myself ",2026-08-23 00:45:48.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Amazon Pay ICICI CC,-12028,,INR,Flight ✈️ Ticket,"HYD - BLR : Aisha, Jafar & Myself ",2026-08-23 00:40:46.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-60,,INR,City Meredian,"1 Ghee Rice Parcel ",2026-08-21 22:50:31.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
HDFC Bank,-299,,INR,YouTube Premium 🎥,,2026-08-21 22:40:12.000,false,subscription,Entertainment,,0XFF2196F3,popcorn,,,,repeat every 1 month
Federal Bank,-75,,INR,Fee,Santro Toll - Kadballi,2026-08-21 21:40:22.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Federal Bank,-75,,INR,Fee,Santro Toll - Kadballi,2026-08-21 16:50:02.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Federal Bank,-1020,,INR,Fuel ⛽,Santro - Nayara - Mueez,2026-08-21 16:09:14.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Cash,-100,,INR,Samosa Bade,Riyaz - Parcel to Maaz Store,2026-08-20 19:45:35.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Cash,-500,,INR,City Meredian,"3 Ghee Rice & ½ Alfaham & Soft drink ",2026-08-19 23:30:51.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Cash,7000,,INR,Cash Transfer In,"Transferred Balance\\nFederal Bank → Cash\\n\\nIrfan Gov ",2026-08-19 22:00:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,repeat every 1 month
Federal Bank,-7000,,INR,Federal Bank Transfer Out,"Transferred Balance\\nFederal Bank → Cash\\n\\nIrfan Gov",2026-08-19 22:00:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,repeat every 1 month
Federal Bank,-711.45,,INR,Reliance,"Wheel Detergent Powder, Brush & Snacks ",2026-08-19 20:52:18.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Federal Bank,-80,,INR,Egg Pav,Me & Mueez,2026-08-19 19:51:45.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-500,,INR,,"Bindu Wedding Gift Contri ",2026-08-19 16:00:40.000,false,default,Gifts,,0XFFF44336,gift,,,,repeat every 1 month
Federal Bank,-220,,INR,Momo,,2026-08-18 18:25:29.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-704,,INR,Amazon,Collagen Supplement - Sufiyan,2026-08-17 21:05:18.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-410,,INR,Fuel ⛽,"Santro - Faizal Shukrana - On they way to Bheriya ",2026-08-15 23:00:34.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-1000,,INR,Clothes 👕👗👖,"Brand Selection - Off-white Lenin Loose Fit Trousers & Green Shirt ",2026-08-15 21:15:43.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-180,,INR,Gobhi Manchurian,"1 Full & Dry, 2 Half - Muthaeeb : Parcel ",2026-08-15 18:30:44.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Cash,-500,,INR,,Shabeena Mami,2026-08-14 16:30:33.000,false,default,Donate,,,loan,,,,repeat every 1 month
Cash,-500,,INR,Abba Khalai,,2026-08-14 15:00:15.000,false,default,Donate,,,loan,,,,repeat every 1 month
Federal Bank,-20,,INR,Soft Drink,Campa Cola,2026-08-14 14:20:55.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Axis Neo CC,-193,,INR,Flipkart,Wet Wipes - Novel Pack of 4,2026-08-14 12:13:08.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-350,,INR,The Lassi Shop,"Me, Jabeer, Faizal & Mubarak Ect. Butter Fruit ",2026-08-13 21:40:45.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-75,,INR,Fee,Santro Toll - Kadballi,2026-08-13 20:30:38.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Federal Bank,-520,,INR,Fuel ⛽,"Santro - Nayara - Indian Oil - Mayasandra ",2026-08-13 19:58:50.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-75,,INR,Fee,Santro Toll - Kadballi,2026-08-13 14:30:39.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Flipkart Axis CC,-5978,,INR,Flipkart,Asics Shoes - Jabeer,2026-08-13 13:35:29.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-60,,INR,"Bade, Bajji & Bhonde Ect",,2026-08-12 18:52:29.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-229,,INR,Flipkart,"Laptop Stand - Tasneem ",2026-08-12 11:02:17.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-2038.3,,INR,H & M,Loose Fit Sweatshirt & Jafar 3 Peace Cotton Set,2026-08-12 09:06:49.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-19,,INR,Cred Store,"Mobile Stand ",2026-08-11 23:05:49.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Axis Neo CC,-70,,INR,Soft Drink,"Ciggerate, Lighter & Campa",2026-08-11 22:22:47.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Axis Neo CC,-200,,INR,Egg Pav,"Me & Maaz - Parcel ",2026-08-11 19:53:43.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-235,,INR,,"Tiramisu and cheesecake @ Old Busstand ",2026-08-10 19:30:36.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-60,,INR,,"Shivan Park - Belsinda - 3 People ",2026-08-10 16:15:05.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
HDFC Millennia CC,-1664,,INR,Empire Restaurant,"Me, Aisha, Tasneem, Jafar & Ali - Passport ",2026-08-10 15:50:05.000,false,default,Dining,Restuarant/Hotel/Outlet,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-62.5,,INR,Fee,Santro Toll - Shantigram,2026-08-10 14:50:56.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Federal Bank,-10,,INR,Xerox Shop,,2026-08-10 12:10:21.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Federal Bank,-62.5,,INR,Fee,Santro Toll - Shantigram,2026-08-10 11:30:35.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Federal Bank,-1020,,INR,Fuel ⛽,Santro - Nayara - Times PU,2026-08-10 11:10:02.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-100,,INR,PP Size Photo,Jafar - POPSK,2026-08-10 10:16:17.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Coral Rupay ICICI CC,10631.11,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Coral Rupay ICICI CC",2026-08-09 23:23:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,repeat every 1 month
Federal Bank,-10631.11,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Coral Rupay ICICI CC",2026-08-09 23:23:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,repeat every 1 month
Scapia Federal CC,1400.79,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Scapia Federal CC",2026-08-09 23:06:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,
Federal Bank,-1400.79,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Scapia Federal CC",2026-08-09 23:06:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,
Amazon Pay ICICI CC,4484.2,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Amazon Pay ICICI CC",2026-08-09 22:45:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,
Federal Bank,-4484.2,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Amazon Pay ICICI CC",2026-08-09 22:45:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,
MakeMyTrip ICICI CC,63940,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → MakeMyTrip ICICI CC",2026-08-09 22:39:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,
Federal Bank,-63940,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → MakeMyTrip ICICI CC",2026-08-09 22:39:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,
Axis Neo CC,-75,,INR,,Aisha - PVC Aadhaar Card - Order,2026-08-09 21:28:17.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Cash,-180,,INR,Miscellaneous,"Not Sure! ",2026-08-09 18:30:09.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Cash,-220,,INR,Fuel ⛽,"Santro - Jio - Channarayapatna ",2026-08-09 17:30:00.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Cash,-150,,INR,,At Imperio Hotel,2026-08-09 16:50:36.000,false,default,Donate,,,loan,,,,repeat every 1 month
HDFC Millennia CC,-11705,,INR,Clothes 👕👗👖,"Max India - Hassan - MySelf, Aisha & Kids Clothes - With Jabeer Bhai Fam",2026-08-09 15:30:40.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,50000,,INR,Transfer,Suhail - Delhi Trip - SHARE,2026-08-09 14:05:15.000,true,default,Transfer,,,exchange-arrows,,,,repeat every 1 month
Cash,-100,,INR,Toys,"For Jafar At Hassan Signal ",2026-08-09 13:30:39.000,false,default,Gifts,,0XFFF44336,gift,,,,repeat every 1 month
Amazon Pay ICICI CC,-1499,,INR,Amazon,"Prime Membership ",2026-08-08 21:18:18.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-30,,INR,,Vade,2026-08-08 20:30:02.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-280,,INR,Bus Ticket,Bengaluru(Majestic) - Channarayapatna (By-pass),2026-08-08 17:50:51.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Axis Neo CC,-20,,INR,Water,,2026-08-08 17:38:58.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-300,,INR,BMTC,"BLR Airport - Majestic ",2026-08-08 15:50:55.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
HDFC Bank,-400,,INR,Cab/Taxi,"Jaipur Junction - Jaipur Airport ",2026-08-08 10:35:54.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
HDFC Millennia CC,-1310,,INR,,"Sarovar Portico - Ajmer - Check Out ",2026-08-08 06:15:02.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Cash,-2200,,INR,,"Donation at Ajmer & Shopping ",2026-08-07 23:59:40.000,false,default,Miscellaneous,,,,❓,,,repeat every 1 month
Federal Bank,-300,,INR,Dinner,Rasna Da Dhaba - Rajasthani Thali,2026-08-07 22:00:47.000,false,default,Dining,Restuarant/Hotel/Outlet,0XFF607D8B,cutlery,,,,repeat every 1 month
Axis Neo CC,-2190,,INR,,"Kesar - Ghewar - Me & Suhail ",2026-08-07 21:10:17.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-3000,,INR,,Bangles - Ajmer -Aisha,2026-08-07 18:00:52.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-100,,INR,Clothes 👕👗👖,Kufi/Topi - Ajmer,2026-08-07 17:20:17.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-545,,INR,Lunch,"Kayinat Hotel ",2026-08-07 17:15:19.000,false,default,Dining,Restuarant/Hotel/Outlet,0XFF607D8B,cutlery,,,,repeat every 1 month
Cash,-2000,,INR,,"Ajmer Shareef - Dadi ",2026-08-07 16:30:17.000,false,default,Donate,,,loan,,,,repeat every 1 month
Cash,5000,,INR,Syed Azizul Haq,"Transferred Balance\\nFederal Bank → Cash",2026-08-07 16:25:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,repeat every 1 month
Federal Bank,-5000,,INR,Syed Azizul Haq,"Transferred Balance\\nFederal Bank → Cash",2026-08-07 16:25:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,repeat every 1 month
Federal Bank,6800,,INR,Transfer,Suhail - Ajmer Trip - SHARE,2026-08-07 16:15:45.000,true,default,Transfer,,,exchange-arrows,,,,repeat every 1 month
Axis Neo CC,-1800,,INR,,Suhail - Ajmer Shareef Chadar,2026-08-07 15:35:43.000,false,default,Donate,,,loan,,,,repeat every 1 month
HDFC Millennia CC,-3390,,INR,Mittal Mall - Ajmer,"Opium - Sunglasses ",2026-08-07 15:00:08.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-160,,INR,Cab/Taxi,"Ajmer Junction - Sarovar Portico ",2026-08-07 07:22:43.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
HDFC Millennia CC,-5000,,INR,Mittal Mall - Ajmer,"ck Perfume - Suhail ",2026-08-07 02:45:49.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-180,,INR,Cab/Taxi,"Hyatt - Gurgaon Railway Station ",2026-08-06 23:15:07.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,30000,,INR,Transfer,Suhail - Delhi Trip - SHARE,2026-08-06 20:12:18.000,true,default,Transfer,,,exchange-arrows,,,,repeat every 1 month
HDFC Millennia CC,-10773.76,,INR,,Hyatt Place - Delhi - Check Out,2026-08-06 20:05:28.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Axis Neo CC,-238,,INR,Zepto,Aisha,2026-08-06 16:25:07.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Federal Bank,-500,,INR,Farewell,Satish Valluvar,2026-08-06 11:40:00.000,false,default,Gifts,,0XFFF44336,gift,,,,repeat every 1 month
Federal Bank,-500,,INR,Cab/Taxi,Nizamuddin - Hyatt Place,2026-08-06 00:25:58.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Axis Neo CC,-2250,,INR,,Suhail - Baqhoor - Chandni Chowk,2026-08-05 23:30:31.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-790,,INR,,Hussaini Hotel - Near Nizamuddin,2026-08-05 23:20:19.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Flipkart Axis CC,708,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Flipkart Axis CC",2026-08-05 20:50:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,
Federal Bank,-708,,INR,Credit Card Bill 💳,"Transferred Balance\\nFederal Bank → Flipkart Axis CC",2026-08-05 20:50:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,
Axis Neo CC,-1555.6,,INR,First Cry,Online - Baby Hug Tshirt & Spinners,2026-08-05 16:22:30.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Axis Neo CC,-50,,INR,Zomato,Delivery Guy Tip,2026-08-05 14:30:15.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Axis Neo CC,-452.83,,INR,Zomato,Bikanerwala - Chole - Bhature & Kulcha,2026-08-05 14:28:04.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Axis Neo CC,-19179.72,,INR,,"Hyatt Place - Delhi ",2026-08-04 14:40:46.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-650,,INR,Cab/Taxi,IIDL Suitcase - Mongo DB - Hyatt Place,2026-08-04 14:05:53.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-300,,INR,Cab/Taxi,"Churriua Mohalla, Tughlakabad - IIDL Suitcase ",2026-08-03 23:30:58.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-20,,INR,Soft Drink,Nimzbuz,2026-08-03 23:05:11.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Axis Neo CC,-350,,INR,Dinner,Tandoor Roti & Nihari along with Campa,2026-08-03 22:50:06.000,false,default,Dining,Restuarant/Hotel/Outlet,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-312,,INR,Cab/Taxi,"IIDL - Churriua Mohalla, Tughlakabad ",2026-08-03 22:20:18.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-1871,,INR,Lunch,"IIDL Suites ",2026-08-03 14:15:19.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-2000,,INR,Dinner,"IIDL Buffet ",2026-08-02 21:50:50.000,false,default,Dining,Restuarant/Hotel/Outlet,0XFF607D8B,cutlery,,,,repeat every 1 month
Axis Neo CC,-1700,,INR,,Jwellery Set - Suhail Cousin Sister Aisha,2026-08-02 15:50:24.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Axis Neo CC,-12000,,INR,,"Suhail Cousin (Aisha) Lehenga ",2026-08-02 15:35:13.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Axis Neo CC,-100,,INR,,Kulladh Malai Rabri,2026-08-02 15:20:42.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-80,,INR,Soda,Chandni Chowk - Bread  Paneer Pakoda,2026-08-02 15:15:07.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
HDFC Bank,-2300,,INR,,Clutch: Ayesha * 2,2026-08-02 15:05:10.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
HDFC Bank,-1000,,INR,,Clutch: Suhail Mom,2026-08-02 15:05:09.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
HDFC Bank,-46000,,INR,,"Rajmahal - Advance {Suhail Wedding Sherwani : 26000, Suhail Cousin & Tejas : 12000 & My Sherwani : 8000} ",2026-08-02 14:30:49.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Axis Neo CC,-2500,,INR,,Jwellery Set - Suhail Mom,2026-08-02 11:45:24.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
HDFC Bank,-3500,,INR,PPF & NPS,,2026-08-02 08:36:31.000,false,repetitive,Investments,,,piggy-bank,,,,repeat every 1 month
HDFC Bank,-15900,,INR,,"Suhail - Mehndi Suits - Choice ",2026-08-01 21:35:11.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Axis Neo CC,-77,,INR,Kaleva,Rasagulla & Rabri Ras Malai,2026-08-01 20:15:57.000,false,default,Dining,Restuarant/Hotel/Outlet,0XFF607D8B,cutlery,,,,repeat every 1 month
Axis Neo CC,-24000,,INR,,"Advance - Indo Western - Suhails  Brother - Darbaar ",2026-08-01 19:30:03.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
HDFC Bank,-1469.78,,INR,Axis Term Insurance,,2026-08-01 17:15:35.000,false,repetitive,Insurance,,0XFF32983F,,🛡,,,repeat every 1 month
Coral Rupay ICICI CC,-344,,INR,Cab/Taxi,IIDL - Karol Bagh,2026-08-01 16:35:59.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
HDFC Bank,-4000,,INR,Grow SIP 💸,,2026-08-01 13:24:48.000,false,repetitive,Investments,,,piggy-bank,,,,repeat every 1 month
Cash,-500,,INR,Cab/Taxi,Banashankari - Airport T1,2026-08-01 07:09:27.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Cash,-150,,INR,Breakfast,"With Driver & Water ",2026-08-01 07:00:36.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-12,,INR,BMTC,"BTM Water Tank - Banashankari ",2026-08-01 05:12:30.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-80,,INR,Metro 🚇,"Nagasandra - BTM Layout ",2026-07-31 22:23:01.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Cash,2000,,INR,Aftab,"Transferred Balance\\nFederal Bank → Cash",2026-07-31 19:49:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,
Federal Bank,-2000,,INR,Aftab,"Transferred Balance\\nFederal Bank → Cash",2026-07-31 19:49:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,
Federal Bank,-183,,INR,Bus Ticket,Channarayapatna - Bengaluru (Jalahalli),2026-07-31 18:45:26.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
HDFC Bank,81262,,INR,July Salary,,2026-07-31 06:22:26.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
Federal Bank,24130.14,,INR,Transfer,Suhail - Delhi Trip - SHARE,2026-07-30 14:05:59.000,true,default,Transfer,,,exchange-arrows,,,,repeat every 1 month
MakeMyTrip ICICI CC,-4696,,INR,,Sarovar Portico - Ajmer,2026-07-29 23:19:16.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
MakeMyTrip ICICI CC,-19890,,INR,,"IIDL Suite - Delhi ",2026-07-29 23:08:20.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-300,,INR,Hair Salon,"Haircut, Beard & Head Massage ",2026-07-29 22:17:26.000,false,default,Beauty & Hygiene,,0XFF9C27B0,flower,,,,repeat every 1 month
Coral Rupay ICICI CC,-180,,INR,Vegetables,Cauliflower,2026-07-28 19:20:48.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Coral Rupay ICICI CC,-460,,INR,Dry Fruits,"Mateen Dukaan - Dates & Walnuts ",2026-07-28 19:15:39.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Federal Bank,-350,,INR,fruits,"Apple & Butter Fruit ",2026-07-28 19:10:36.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Federal Bank,-160,,INR,fruits,Banana,2026-07-28 19:05:05.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Coral Rupay ICICI CC,-669,,INR,Reliance,"Caramel Popcorn, Snacks, Paneer, Oats & Corn 🌽",2026-07-28 19:00:47.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Coral Rupay ICICI CC,-75,,INR,Flour Mill,"Rice, Siri Dhanya & Ragi",2026-07-28 14:10:19.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Coral Rupay ICICI CC,-100,,INR,Soft Drink,"Campa & Hana - Sayeed Biryani Party ",2026-07-27 22:10:18.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Coral Rupay ICICI CC,-50,,INR,Wheat 🌾,1 Kg,2026-07-27 21:28:34.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Coral Rupay ICICI CC,-150,,INR,Samosa Point,Samosa * 5,2026-07-27 19:44:45.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-700,,INR,Transfer,"Mueez - Whatsapp ",2026-07-27 17:04:04.000,false,default,Transfer,,,exchange-arrows,,,,repeat every 1 month
Coral Rupay ICICI CC,-600,,INR,Bakery 🧁,"Pastry Cake 🎂 - Cake World ",2026-07-26 19:55:37.000,false,default,Dining,,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-750,,INR,,KEA KRIES RECRUITMENT - AISHA,2026-07-26 12:55:43.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Federal Bank,-750,,INR,,KEA KRIES RECRUITMENT - MYSELF,2026-07-26 00:05:42.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Coral Rupay ICICI CC,-12.04,,INR,YOM,,2026-07-25 23:19:00.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Coral Rupay ICICI CC,-1020,,INR,Fuel ⛽,Santro - 87080Km,2026-07-25 19:01:08.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Coral Rupay ICICI CC,-1757,,INR,Empire Restaurant,"Tasneem, Aisha, Jafar & MySelf",2026-07-25 08:45:42.000,false,default,Dining,Restuarant/Hotel/Outlet,0XFF607D8B,cutlery,,,,repeat every 1 month
Federal Bank,-600,,INR,Car Service,"Accelerator cable replacement ",2026-07-23 18:11:11.000,false,default,Repair & Service,,,,🛠,,,repeat every 1 month
Coral Rupay ICICI CC,-1430.2,,INR,Reliance,"Me, Aisha & Jafar",2026-07-22 20:59:43.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
HDFC Bank,1000,,INR,Transfer,"Transferred Balance\\nJafar's HDFC Bank → HDFC Bank",2026-07-22 17:18:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,
Jafar's HDFC Bank,2000,,INR,Transfer,"Transferred Balance\\nHDFC Bank → Jafar's HDFC Bank",2026-07-22 17:18:31.000,true,default,Balance Correction,,0XFF607D8B,,💲,,,
HDFC Bank,-2000,,INR,Transfer,"Transferred Balance\\nHDFC Bank → Jafar's HDFC Bank",2026-07-22 17:18:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,
Jafar's HDFC Bank,-1000,,INR,Transfer,"Transferred Balance\\nJafar's HDFC Bank → HDFC Bank",2026-07-22 17:18:30.000,false,default,Balance Correction,,0XFF607D8B,,💲,,,
Federal Bank,5,,INR,Cashback,"Nyka Order ",2026-07-22 14:43:23.000,true,default,"Rewards, Cashback, Refund Or Interest",,,,🏆,,,repeat every 1 month
Federal Bank,-300,,INR,Nykaa,For Aisha,2026-07-22 14:43:22.000,false,default,Shopping,,0XFFE91E63,shopping,,,,repeat every 1 month
Federal Bank,-470,,INR,Eggs,"2 Crates ",2026-07-21 21:54:15.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Federal Bank,-100,,INR,fruits,Banana,2026-07-21 21:53:32.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
HDFC Bank,-299,,INR,YouTube Premium 🎥,,2026-07-21 20:41:26.000,false,subscription,Entertainment,,0XFF2196F3,popcorn,,,,repeat every 1 month
Coral Rupay ICICI CC,-199,,INR,Recharge,"Sharfoon Apa ",2026-07-21 11:49:16.000,false,default,Communication,,,internet-globe,,,,repeat every 1 month
Federal Bank,-20,,INR,,Pencil & Eraser - Hareem,2026-07-20 20:47:38.000,false,default,Stationary,,,note,,,,repeat every 1 month
Coral Rupay ICICI CC,-58,,INR,Milk 🥛,1 Liter,2026-07-19 19:47:10.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Coral Rupay ICICI CC,-70,,INR,Vegetables,"Cauliflower & Potato ",2026-07-19 18:25:03.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Federal Bank,-30,,INR,fruits,Banana,2026-07-18 21:37:05.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Federal Bank,-775,,INR,Dr. Shekar,"Ali - Constipation,Jafar - Skin Infection Like Heat Rash/Gobri",2026-07-18 13:05:22.000,false,default,Health,,,healthcare-and-medical,,,,repeat every 1 month
Coral Rupay ICICI CC,-11.21,,INR,PTM,,2026-07-17 23:18:00.000,false,default,Bills & Fees,,0XFF4CAF50,,💸,,,repeat every 1 month
Coral Rupay ICICI CC,-300,,INR,fruits,"Rambutan - NH 75 Highway - 1Kg - Mayasandra ",2026-07-17 13:05:16.000,false,default,Groceries,,0XFF4CAF50,groceries,,,,repeat every 1 month
Coral Rupay ICICI CC,-950,,INR,Fuel ⛽,Diesel - Ritz - Channarayapatna - Mayasandra & Back,2026-07-17 12:32:36.000,false,default,Transit-Travel,,0XFFFFEB3B,,🧳,,,repeat every 1 month
Federal Bank,-50000,,INR,Transfer,"Abba - Home Purchase",2026-06-30 10:01:19.000,false,default,Transfer,,,exchange-arrows,,,Home Purchase 🏡,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2026-06-30 09:00:11.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
Federal Bank,100000,,INR,,Fares - Coder,2026-06-27 07:48:53.000,true,default,Transfer,,,exchange-arrows,,,,repeat every 1 month
MakeMyTrip ICICI CC,-71894,,INR,Wedding Gifts,"Fares(Coder) - Honeymoon Trip - Manali & Shimla",2026-04-07 16:31:16.000,false,default,Gifts,,0XFFF44336,gift,,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2026-05-29 10:39:25.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2026-04-30 11:13:25.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2026-03-30 10:45:09.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81162,,INR,Salary - Capgemini,,2026-02-27 10:17:27.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2026-01-30 10:20:46.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81212,,INR,Salary - Capgemini,,2025-12-31 11:35:55.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2025-11-28 11:45:54.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2025-10-31 09:43:37.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2025-09-30 13:10:39.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2025-08-29 14:10:38.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2025-07-31 14:10:37.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2025-06-30 12:43:58.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2025-05-30 12:13:24.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2025-04-30 11:48:00.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,81262,,INR,Salary - Capgemini,,2025-03-28 12:55:00.000,true,default,Income,,0XFF9575CD,,🪙,,,repeat every 1 month
HDFC Bank,52169,,INR,Salary - Capgemini Feb,,2025-02-28 21:51:00.000,true,default,Income,,0XFF9575CD,,🪙,,,
HDFC Bank,30336,,INR,CTS Final Settlement,,2025-02-28 21:52:00.000,true,default,Income,,0XFF9575CD,,🪙,,,
HDFC Bank,43994,,INR,Salary - Cognizant,,2025-02-01 06:54:00.000,true,default,Income,,0XFF9575CD,,🪙,,,
HDFC Bank,43994,,INR,Salary - Cognizant,,2024-12-31 14:13:00.000,true,default,Income,,0XFF9575CD,,🪙,,,
HDFC Bank,43994,,INR,Salary - Cognizant,,2024-11-29 10:08:00.000,true,default,Income,,0XFF9575CD,,🪙,,,
RBL Shoprite CC,35000,,INR,Adjust balance,,2024-08-31 18:21:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
Scapia Federal CC,27000,,INR,Adjust balance,,2024-08-31 17:50:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
Coral Rupay ICICI CC,119919.31,,INR,Adjust balance,,2024-08-31 17:48:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
Simply Click SBI CC,124000,,INR,Adjust balance,,2024-08-31 17:48:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
MakeMyTrip ICICI CC,120000,,INR,Adjust balance,,2024-08-31 17:46:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
Amazon Pay ICICI CC,119244.03,,INR,Adjust balance,,2024-08-31 17:45:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
HDFC Millennia CC,152761.23,,INR,Adjust balance,,2024-08-31 17:44:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
Flipkart Axis CC,160000,,INR,Adjust balance,,2024-08-31 17:37:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
HDFC Bank,31839.98,,INR,Adjust balance,,2024-08-31 17:35:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
Federal Bank,4409.78,,INR,Adjust balance,,2024-08-31 17:34:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
Axis Neo CC,160000,,INR,Adjust balance,,2024-08-31 14:31:01.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
Cash,3200,,INR,Adjust balance,,2024-08-31 14:31:00.000,true,default,Initial Amount,,,crypto,,,,repeat every 1 month
`;

/**
 * Quick helper to parse and apply the user's exported data directly into state
 */
export async function restoreUserExportData(currentState: LocalStorageState): Promise<LocalStorageState> {
  const result = await parseCashewDataAsync(USER_RESTORE_CSV, currentState, {
    mode: 'REPLACE',
    autoConvertForeignCurrencies: true,
    createMissingAccounts: true,
    createMissingCategories: true,
    defaultCurrency: 'INR',
  });

  return applyCashewImport(currentState, result, 'REPLACE');
}
