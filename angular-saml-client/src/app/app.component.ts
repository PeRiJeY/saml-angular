import {Component, OnInit} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {HttpErrorResponse} from "@angular/common/http/src/response";
import {ApiToken} from "./ApiToken";
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title = 'app';

  apiToken: string;

  sessionId: string;

  errorMessage: string;

  externalServerApiExample;

  logoutSuccess: boolean;

  authServerApiExample: string;

  constructor(private httpClient: HttpClient,
      private route: ActivatedRoute) {

    this.route.queryParams.subscribe(params => {
        this.setSessionCookie(params['sessionId']);
    });
  }

  ngOnInit(): void {

  }

  setSessionCookie(sessionId: string) {
    if (sessionId != undefined && sessionId != "") {
      console.log('SessionId: ' + sessionId);
      document.cookie = "JSESSIONID=" + sessionId;
      this.sessionId = sessionId;
    }
  }

  handleTokenSuccess(apiToken: string) {
    localStorage.setItem("apiToken", apiToken);
    this.apiToken = apiToken;
    this.errorMessage = null;
  }

  handleTokenError(error: HttpErrorResponse) {
    this.errorMessage = JSON.stringify(error);
  }

  postLogin() {
    var formData: any = new FormData();
    formData.append("username", 'juange');
    formData.append("password", 'juange');

    this.httpClient.post("/service/auth/login", formData,
      {
        withCredentials: true,
        responseType: 'text'
      }
      ).subscribe(
        r => { this.setSessionCookie(r)},
        error => this.handleTokenError(error));
  }

  getToken() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/service/auth/token', {
      responseType: 'text',
    }).subscribe(
        r => this.handleTokenSuccess(r),
        error => this.handleTokenError(error));
  }

  callApiAuthServer() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('/service/api/hello', {
      responseType: 'text',
      withCredentials : true,
      headers: {
        "Authorization": apiToken != null ? apiToken : ''
      }
    }).subscribe(
      r => this.authServerApiExample = r,
      error => this.handleTokenError(error)
      );
  }

  callApiExternal() {
    let apiToken = localStorage.getItem("apiToken");

    this.httpClient.get('http://samlintegration.sandetel.int:8081/api/pacientes/1', {
      headers: {
        "Authorization": apiToken
      }
    }).subscribe(r => this.externalServerApiExample = JSON.stringify(r));
  }

  samlLogin() {
    window.location.href="/service/saml/login";
  }

  logout() {
    console.log('logout');
    localStorage.removeItem('apiToken');
    this.httpClient.get('/service/saml/logout').subscribe(() => this.logoutSuccess = true);
  }


}
