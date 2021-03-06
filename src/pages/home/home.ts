
import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { NativeStorage } from '@ionic-native/native-storage';
import { PopoverController } from 'ionic-angular';
import { DbProvider } from '../../providers/db/db';
import { Platform } from 'ionic-angular';
import { PopoverPage } from '../popover/popover';

import { NotificationPage } from '../notification/notification';
import { OneSignal } from '@ionic-native/onesignal';
import { Http } from '@angular/http';
import 'rxjs/add/operator/map';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  private items : any = [{name : 'Loading...', cpf : 999, mobile : '8259950403'}];
  private init : any;
  private username : any;

  constructor(public navCtrl: NavController, private platform : Platform, private http : Http, private oneSignal : OneSignal,
              private dbo : DbProvider, private storage : NativeStorage, private popover : PopoverController) {

    this.platform.ready().then(()=>{

      this.oneSignal.startInit('ee0a38d4-d62f-4a3c-b2c4-4aa18e821003', '867730921447');
      this.oneSignal.inFocusDisplaying(this.oneSignal.OSInFocusDisplayOption.InAppAlert);
      this.oneSignal.handleNotificationReceived().subscribe(() => {
       // do something when notification is received
      });
      this.oneSignal.handleNotificationOpened().subscribe((data) => {
        // do something when a notification is opened

        this.navCtrl.push(NotificationPage, { title : data.notification.payload.title, 
                                              body  : data.notification.payload.body});
      });
      this.oneSignal.endInit();

      this.storage.getItem('savedItem')
        .then(
          (data) => {
                    console.log("Logged In with " + data.cpf);
                    this.username = data.cpf;
                    this.oneSignal.sendTag("CPFNO",data.cpf);
                    },
          error  =>{
                    navCtrl.setRoot('LoginPage');
                   }
        );
      this.dbo.createDatabase().then(()=>{
        this.select();
        console.log(">> Checking for updates!");
        this.checkForUpdates();
      });
    });



  }

  doRefresh(refresher) {
   this.dbo.readValues().then(res => {
      this.items = res;
      this.init = res;
      refresher.complete();
    })
  }

  checkForUpdates() {
    this.dbo.updateCheck(this.username).then((writeStatus)=>{
      if(writeStatus == "success"){
        let ackUrl = 'http://sreenathsdas.16mb.com/oagtv2/ack.php?cpf=' + this.username;
        this.http.get(ackUrl).map(res => res.json()).subscribe(result => {
          console.log("Acknowledged the update : " + result);
        });
      }
    });
  }

  presentPopover(myEvent) {
    let popover = this.popover.create(PopoverPage , { cpf : this.username });
    popover.present({
      ev: myEvent
    });
  }

  buttonClick(selected : any){
    this.navCtrl.push('DetailsPage', { item : selected });
  }

  getItems(ev: any) {

    this.items = this.init;
    let val = ev.target.value;
    if (val && val.trim() != '') {

      this.items = this.init.filter((item) => {
        return (item.name.toLowerCase().indexOf(val.toLowerCase()) > -1);
      });

      this.items = this.items.concat(this.init.filter((item) => {
        return (item.cpf.toLowerCase().indexOf(val.toLowerCase()) > -1);
      }));

      this.items = this.items.concat(this.init.filter((item) => {
        return (item.mobile.toLowerCase().indexOf(val.toLowerCase()) > -1);
      }));

      this.items = this.items.concat(this.init.filter((item) => {
        return (item.search_tag.toLowerCase().indexOf(val.toLowerCase()) > -1);
      }));

    }

  }

  select(){
    this.dbo.readValues().then(res => {
      this.items = res;
      this.init = res;
    })
  }


}
