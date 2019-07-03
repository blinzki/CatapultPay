/*
 * MIT License
 *
 * Copyright (c) 2017 David Garcia <dgarcia360@outlook.com>
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */


import {Component} from '@angular/core';
import {LoadingController, MenuController, NavController, NavParams} from 'ionic-angular';
import {TranslateService} from '@ngx-translate/core';
import {AlertProvider} from '../../providers/alert/alert.provider';
import {WalletProvider} from '../../providers/wallet/wallet.provider';
import {TransferPage} from '../transfer/transfer';
import {ReceivePage} from '../receive/receive';
import {LoginPage} from '../login/login';
import {AccountHttp, AccountOwnedMosaicsService, MosaicHttp, MosaicTransferable, Wallet} from 'nem-library';

@Component({
    selector: 'page-balance',
    templateUrl: 'balance.html'
})

export class BalancePage {
    private accountHttp: AccountHttp;
    private mosaicHttp: MosaicHttp;
    private accountOwnedMosaicsService: AccountOwnedMosaicsService;
    private selectedWallet: Wallet;
    private balance: MosaicTransferable[];
    private selectedMosaic: MosaicTransferable;
    private rawRecipient: string;

    constructor(public navCtrl: NavController, private navParams:NavParams, private wallet: WalletProvider,
                private menu: MenuController, public translate: TranslateService, private alert: AlertProvider,
                private loading: LoadingController) {
        this.accountHttp = new AccountHttp();
        this.mosaicHttp = new MosaicHttp();
        this.accountOwnedMosaicsService = new AccountOwnedMosaicsService(this.accountHttp, this.mosaicHttp);
        this.rawRecipient = navParams.get('address') || null;
    }

    ionViewWillEnter() {
        if (!this.rawRecipient) {
            this.menu.enable(true);
        }

        this.selectedWallet = this.wallet.getSelectedWallet();
        if (!this.selectedWallet) {
            this.navCtrl.setRoot(LoginPage);
        } else {
            this.getBalance(false);
        }
    }

    /**
     * Gets current account owned mosaics into this.balance.
     * @param refresher Ionic refresher or false when called on load
     */
    public getBalance(refresher: any) {
        let loader;

        this.translate
            .get('PLEASE_WAIT', {})
            .mergeMap(res => {
                loader = this.loading.create({content: res});

                if (!refresher){
                    loader.present();
                }
                return this.accountOwnedMosaicsService.fromAddress(this.selectedWallet.address);
            })
            .subscribe((balance) => {

                this.balance = balance;
                if (this.balance.length > 0) {
                    this.selectedMosaic = this.balance[0];
                }
                if (refresher) {
                    refresher.complete();
                } else {
                    loader.dismiss();
                }
            }, err => console.log(err));
    }

    /**
     * Moves to transfer page
     */
    goToTransfer(){
        this.navCtrl.push(TransferPage, {
            'selectedMosaic': this.selectedMosaic,
            'address': this.rawRecipient
        });
    }

    /**
     * Moves to receive page
     */
    goToReceive(){
        this.navCtrl.push(ReceivePage, {
            selectedMosaic: this.selectedMosaic
        });
    }
}
