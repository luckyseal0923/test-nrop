import{createClient}from'@supabase/supabase-js';
let client,clientConfig;
export function configureAuth(info){
 if(!info.configured)return null;
 const key=info.supabaseUrl+'|'+info.supabasePublishableKey;
 if(client&&clientConfig===key)return client;
 clientConfig=key;client=createClient(info.supabaseUrl,info.supabasePublishableKey,{auth:{persistSession:true,storage:window.sessionStorage,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
 return client;
}
export function authClient(){if(!client)throw new Error('Supabase 尚未設定');return client;}
export async function currentUser(){const{data,error}=await authClient().auth.getSession();if(error)throw error;return data.session?.user||null;}
export async function accessToken(){const{data,error}=await authClient().auth.getSession();if(error||!data.session)throw new Error('請先登入 Supabase 練習帳號。');return data.session.access_token;}
